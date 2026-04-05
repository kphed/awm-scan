import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dir, "..");
const SOURCE_BUNDLES_DIR = path.join(REPO_ROOT, "src/contracts/source");
const FOUNDRY_PROJECT_DIR = path.join(REPO_ROOT, "contracts");
const ODA_CONTRACTS_PREFIX =
  "@odaplatform/da-fact-smartcontracts/contracts/";
const OPENZEPPELIN_PREFIX = "@openzeppelin/";
const CONTRACTS_PREFIX = "contracts/";
const DIAMOND_PROXY_COMPILER = "v0.8.17+commit.8df45f5f";

type BundleLike = Record<string, unknown>;

type BundleEntry = {
  SourceCode: string;
  ContractName: string;
  CompilerVersion: string;
  ContractFileName: string;
  EVMVersion?: string;
};

type StandardJsonInput = {
  settings?: {
    evmVersion?: string;
  };
  sources?: Record<string, { content?: string }>;
};

export type ParsedBundle = {
  address: string | null;
  contractName: string;
  compilerVersion: string;
  contractFileName: string;
  evmVersion: string | null;
  sources: Record<string, string>;
};

export type PlannedWrite = {
  compilerVersion: string;
  content: string;
  sourcePath: string;
  targetPath: string;
};

type ExtractionStats = {
  identical: number;
  skippedExternal: number;
  written: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readStringField(
  value: Record<string, unknown>,
  field: keyof BundleEntry,
): string {
  const nextValue = value[field];

  if (typeof nextValue !== "string" || nextValue.length === 0) {
    throw new Error(`Missing string field "${field}" in source bundle entry.`);
  }

  return nextValue;
}

function getBundleEntry(bundle: BundleLike): BundleEntry {
  const candidate = isRecord(bundle["0"]) ? bundle["0"] : bundle;

  if (!isRecord(candidate)) {
    throw new Error("Source bundle is not an object.");
  }

  return {
    SourceCode: readStringField(candidate, "SourceCode"),
    ContractName: readStringField(candidate, "ContractName"),
    CompilerVersion: readStringField(candidate, "CompilerVersion"),
    ContractFileName: readStringField(candidate, "ContractFileName"),
    EVMVersion:
      typeof candidate.EVMVersion === "string" ? candidate.EVMVersion : undefined,
  };
}

function normalizeStandardJsonInput(sourceCode: string): string {
  if (sourceCode.startsWith("{{") && sourceCode.endsWith("}}")) {
    return `{${sourceCode.slice(2, -2)}}`;
  }

  return sourceCode;
}

export function parseBundle(bundle: BundleLike): ParsedBundle {
  const entry = getBundleEntry(bundle);
  const address = typeof bundle.address === "string" ? bundle.address : null;
  const rawInput = normalizeStandardJsonInput(entry.SourceCode);
  const parsedInput = JSON.parse(rawInput) as StandardJsonInput;

  if (!isRecord(parsedInput.sources)) {
    throw new Error(
      `Bundle "${entry.ContractFileName}" is missing a Standard JSON sources object.`,
    );
  }

  const sources = Object.fromEntries(
    Object.entries(parsedInput.sources).map(([sourcePath, source]) => {
      if (!isRecord(source) || typeof source.content !== "string") {
        throw new Error(
          `Bundle "${entry.ContractFileName}" has invalid source content for "${sourcePath}".`,
        );
      }

      return [sourcePath, source.content];
    }),
  );

  return {
    address,
    contractName: entry.ContractName,
    compilerVersion: entry.CompilerVersion,
    contractFileName: entry.ContractFileName,
    evmVersion: parsedInput.settings?.evmVersion ?? entry.EVMVersion ?? null,
    sources,
  };
}

export function mapSourcePathToTarget(
  sourcePath: string,
  compilerVersion: string,
): string | null {
  if (sourcePath.startsWith(OPENZEPPELIN_PREFIX)) {
    return null;
  }

  if (sourcePath.startsWith(ODA_CONTRACTS_PREFIX)) {
    return path.posix.join("src", sourcePath.slice(ODA_CONTRACTS_PREFIX.length));
  }

  if (!sourcePath.startsWith(CONTRACTS_PREFIX)) {
    throw new Error(`Unsupported source path "${sourcePath}".`);
  }

  const relativePath = sourcePath.slice(CONTRACTS_PREFIX.length);
  const targetRoot =
    compilerVersion === DIAMOND_PROXY_COMPILER ? "src/diamond-proxy" : "src";

  return path.posix.join(targetRoot, relativePath);
}

export function planBundleWrites(bundles: ParsedBundle[]): PlannedWrite[] {
  const writesByTarget = new Map<string, PlannedWrite>();

  for (const bundle of bundles) {
    for (const [sourcePath, content] of Object.entries(bundle.sources)) {
      const targetPath = mapSourcePathToTarget(sourcePath, bundle.compilerVersion);

      if (targetPath === null) {
        continue;
      }

      const existingWrite = writesByTarget.get(targetPath);

      if (!existingWrite) {
        writesByTarget.set(targetPath, {
          compilerVersion: bundle.compilerVersion,
          content,
          sourcePath,
          targetPath,
        });
        continue;
      }

      if (existingWrite.content !== content) {
        throw new Error(
          `Conflicting source content for "${targetPath}" from "${existingWrite.sourcePath}" and "${sourcePath}".`,
        );
      }
    }
  }

  return Array.from(writesByTarget.values()).sort((left, right) =>
    left.targetPath.localeCompare(right.targetPath),
  );
}

async function loadBundles(): Promise<ParsedBundle[]> {
  const bundleNames = (await readdir(SOURCE_BUNDLES_DIR))
    .filter((name) => name.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(
    bundleNames.map(async (bundleName) => {
      const bundlePath = path.join(SOURCE_BUNDLES_DIR, bundleName);
      const bundle = JSON.parse(
        await readFile(bundlePath, "utf8"),
      ) as Record<string, unknown>;

      return parseBundle(bundle);
    }),
  );
}

async function writePlannedFiles(writes: PlannedWrite[]): Promise<ExtractionStats> {
  const stats: ExtractionStats = {
    identical: 0,
    skippedExternal: 0,
    written: 0,
  };

  for (const write of writes) {
    const absoluteTargetPath = path.join(FOUNDRY_PROJECT_DIR, write.targetPath);

    await mkdir(path.dirname(absoluteTargetPath), { recursive: true });

    let existingContent: string | null = null;
    try {
      existingContent = await readFile(absoluteTargetPath, "utf8");
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
        throw error;
      }
    }

    if (existingContent === write.content) {
      stats.identical += 1;
      continue;
    }

    await writeFile(absoluteTargetPath, write.content);
    stats.written += 1;
  }

  return stats;
}

function countExternalSources(bundles: ParsedBundle[]): number {
  return bundles.reduce((total, bundle) => {
    return (
      total +
      Object.keys(bundle.sources).filter((sourcePath) =>
        sourcePath.startsWith(OPENZEPPELIN_PREFIX),
      ).length
    );
  }, 0);
}

export async function runExtraction(): Promise<ExtractionStats> {
  const bundles = await loadBundles();
  const writes = planBundleWrites(bundles);
  const stats = await writePlannedFiles(writes);

  stats.skippedExternal = countExternalSources(bundles);

  return stats;
}

if (import.meta.main) {
  try {
    const stats = await runExtraction();

    console.log(
      [
        "[extractSolidity] completed",
        `written=${stats.written}`,
        `identical=${stats.identical}`,
        `skippedExternal=${stats.skippedExternal}`,
      ].join(" "),
    );
  } catch (error) {
    console.error("[extractSolidity] error", error);
    process.exitCode = 1;
  }
}
