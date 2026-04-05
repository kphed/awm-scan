import type {
  ArchitectureData,
  SourceFileEntry,
  SourceFileRecord,
} from "./types";

export interface LineRange {
  start: number;
  end: number;
}

export interface SourceOwner {
  address: string;
  displayName: string;
  technicalName: string;
}

function toPositiveInteger(value: string) {
  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseLineRangeParam(
  value?: string | string[] | null,
): LineRange | null {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return null;
  }

  const [startToken, endToken] = rawValue.split("-");
  const start = toPositiveInteger(startToken);
  const end = toPositiveInteger(endToken ?? startToken);

  if (!start || !end || end < start) {
    return null;
  }

  return { start, end };
}

export function formatLineRange(range?: LineRange | null) {
  if (!range) {
    return "Ln -";
  }

  return range.start === range.end
    ? `Ln ${range.start}`
    : `Ln ${range.start}-${range.end}`;
}

export function buildSourceExplorerHref(
  filePath: string,
  range?: LineRange | null,
) {
  const encodedPath = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  if (!range) {
    return `/source/${encodedPath}`;
  }

  const lineParam =
    range.start === range.end
      ? `${range.start}`
      : `${range.start}-${range.end}`;

  return `/source/${encodedPath}?line=${lineParam}`;
}

export function flattenSourceFileTree(entries: SourceFileEntry[]) {
  const flattened: SourceFileEntry[] = [];

  for (const entry of entries) {
    if (entry.type === "file") {
      flattened.push(entry);
      continue;
    }

    flattened.push(...flattenSourceFileTree(entry.children ?? []));
  }

  return flattened;
}

export function findSourceFileEntry(
  entries: SourceFileEntry[],
  targetPath: string,
): SourceFileEntry | null {
  for (const entry of entries) {
    if (entry.path === targetPath) {
      return entry;
    }

    if (entry.type === "directory") {
      const nestedMatch = findSourceFileEntry(entry.children ?? [], targetPath);

      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  return null;
}

export function getDefaultSourcePath(
  sourceFiles: Record<string, SourceFileRecord>,
) {
  return Object.keys(sourceFiles).sort()[0] ?? null;
}

function toOwnerRecord(owner: {
  address?: string;
  displayName: string;
  name: string;
}) {
  if (!owner.address) {
    return null;
  }

  return {
    address: owner.address,
    displayName: owner.displayName,
    technicalName: owner.name,
  } satisfies SourceOwner;
}

function registerSourceOwner(
  owners: Map<string, SourceOwner>,
  owner: ReturnType<typeof toOwnerRecord>,
  fileName: string,
  relatedSourceFiles?: Array<Pick<SourceFileRecord, "name" | "path">>,
) {
  if (!owner) {
    return;
  }

  for (const file of relatedSourceFiles ?? []) {
    if (file.name !== fileName) {
      continue;
    }

    owners.set(file.path, owner);
  }
}

export function buildSourceOwnerMap(data: ArchitectureData) {
  const owners = new Map<string, SourceOwner>();

  for (const cluster of data.clusters) {
    for (const facet of cluster.facets) {
      registerSourceOwner(
        owners,
        toOwnerRecord(facet),
        `${facet.name}.sol`,
        facet.relatedSourceFiles,
      );
    }
  }

  registerSourceOwner(
    owners,
    toOwnerRecord({
      address: data.diamondProxy.address,
      displayName: data.diamondProxy.displayName,
      name: data.diamondProxy.technicalName,
    }),
    `${data.diamondProxy.technicalName}.sol`,
    [
      {
        path: "diamond-proxy/FactTokenDiamond.sol",
        name: "FactTokenDiamond.sol",
      },
    ],
  );

  return owners;
}
