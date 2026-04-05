import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import parser from "@solidity-parser/parser";
import { codeToHtml, codeToTokens } from "shiki";
import { getAllFacets } from "../src/lib/contracts/abi-parser";
import { FACET_REGISTRY } from "../src/lib/contracts/registry";

const CONTRACTS_SRC_ROOT = path.resolve(process.cwd(), "contracts/src");
const FOUNDRY_CONFIG_PATH = path.resolve(process.cwd(), "contracts/foundry.toml");
const OUTPUT_DIR = path.resolve(process.cwd(), "src/contracts/source-metadata");
const SHIKI_THEME = "github-light";

type ModifierType = "role" | "pause" | "account" | "token" | "other";
type StorageAccessMode = "read" | "write";

interface SourceLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

interface ParserNode {
  type: string;
  name?: string | null;
  kind?: string;
  path?: string;
  loc?: SourceLocation;
  range?: [number, number];
  comments?: ParserComment[];
  subNodes?: ParserNode[];
  baseContracts?: ParserNode[];
  body?: ParserNode | null;
  parameters?: ParserNode[];
  returnParameters?: ParserNode[] | null;
  modifiers?: ParserNode[];
  arguments?: ParserNode[] | null;
  expression?: ParserNode;
  typeName?: ParserNode;
  memberName?: string;
  namePath?: string;
  length?: ParserNode | null;
  keyType?: ParserNode;
  valueType?: ParserNode;
  [key: string]: unknown;
}

interface ParserComment {
  type: string;
  value: string;
  loc?: SourceLocation;
  range?: [number, number];
}

interface ParsedSourceFile {
  path: string;
  fullPath: string;
  content: string;
  lines: string[];
  ast: ParserNode;
  comments: ParserComment[];
  imports: string[];
  compilerProfile: string;
  solcVersion: string;
}

interface ContractDefinitionInfo {
  name: string;
  kind: "contract" | "interface" | "library";
  filePath: string;
  baseContracts: string[];
  node: ParserNode;
}

interface MethodSourceInfo {
  body: string;
  startLine: number;
  endLine: number;
  filePath: string;
}

interface NatSpecInfo {
  notice?: string;
  dev?: string[];
  params?: Record<string, string>;
  returns?: Record<string, string>;
}

interface ModifierInfo {
  name: string;
  filePath: string;
  line: number;
  resolvedCall?: string;
  type: ModifierType;
}

interface DependencyProof {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet: string;
  explanation: string;
}

interface LibraryUsage {
  facetName: string;
  displayName: string;
  usageSummary: string;
}

interface LibraryCrossReference {
  libraryName: string;
  filePath: string;
  compilerProfile: string;
  solcVersion: string;
  usages: LibraryUsage[];
}

interface StorageAccessField {
  name: string;
  access: StorageAccessMode;
}

interface StorageAccessInfo {
  libraryName: string;
  filePath: string;
  structName: string;
  fields: StorageAccessField[];
}

interface SourceToken {
  content: string;
  color?: string;
  fontStyle?: number;
}

interface SourceFileRecord {
  path: string;
  name: string;
  content: string;
  highlightedHtml: string;
  tokenLines: SourceToken[][];
  compilerProfile: string;
  solcVersion: string;
}

interface ImportGraphEntry {
  filePath: string;
  imports: string[];
  importedBy: string[];
}

interface SourceFileEntry {
  path: string;
  name: string;
  type: "file" | "directory";
  children?: SourceFileEntry[];
  size?: number;
  solidityVersion?: string;
  compilerProfile?: string;
  solcVersion?: string;
}

interface SourceMetadataArtifacts {
  functionBodies: Record<string, Record<string, MethodSourceInfo>>;
  natspec: Record<string, Record<string, NatSpecInfo>>;
  modifierChains: Record<string, Record<string, ModifierInfo[]>>;
  dependencyProofs: Record<string, Record<string, DependencyProof>>;
  libraryCrossReferences: Record<string, LibraryCrossReference>;
  storageAccess: Record<string, StorageAccessInfo[]>;
  sourceFiles: Record<string, SourceFileRecord>;
  importGraph: Record<string, ImportGraphEntry>;
  fileTree: SourceFileEntry[];
}

interface DependencyHint {
  patterns: string[];
  before?: number;
  after?: number;
  filePath?: string;
}

const PROOF_HINTS: Record<string, DependencyHint> = {
  StopCodesFacet: {
    patterns: ["modifier onlyNotStopped", "LibStopCodes._getStopCodes"],
    before: 0,
    after: 0,
  },
  ERC20FacetTransferBurnableStoppable: {
    patterns: ["LibERC20.ref()._totalSupply", "LibERC20._transfer", "LibERC20.ref()._balances"],
    before: 0,
    after: 0,
  },
  BurnRespondableFacet: {
    patterns: ["LibBurnRequestable._approveBurn", "LibBurnRequestable._rejectBurn"],
    before: 0,
    after: 0,
  },
  BurnPreparableFacet: {
    patterns: ["LibBurnRequestable._prepareBurn"],
    before: 0,
    after: 0,
  },
  TimelockableFacet: {
    patterns: ["LibTimelockable._executeTransaction"],
    before: 0,
    after: 0,
  },
  ManagedTokenFacetTimelockable: {
    patterns: ["LibManagedToken.ref()._inactive", "LibManagedToken"],
    before: 0,
    after: 0,
  },
  ManagedAccountFacet: {
    patterns: ["LibManagedAccount._accountActive", "LibManagedAccount"],
    before: 0,
    after: 0,
  },
  AccessControlFacetTimelockable: {
    patterns: ["LibAccessControl._hasRole", "getRoleAdmin", "LibAccessControl"],
    before: 0,
    after: 0,
  },
};

const LIBRARY_USAGE_SUMMARIES: Record<string, string> = {
  LibStopCodes:
    "Reads per-account stop codes before allowing transfers or burner-address redemptions.",
  LibAccessControl:
    "Enforces role checks through facet modifiers and role-administration calls.",
  LibPausable:
    "Reads or mutates the shared pause rail that gates token operations.",
  LibManagedToken:
    "Reads or updates the fund token's active-state controls.",
  LibManagedAccount:
    "Reads or mutates investor-account status and account-level restrictions.",
  LibBurnRequestable:
    "Stages, approves, or rejects queued burn requests and settlement state.",
  LibMintable:
    "Creates mint requests and updates shared ERC-20 supply state.",
  LibERC20:
    "Mutates the shared ERC-20 balances, allowances, and total-supply ledger.",
  LibFactBase:
    "Reads and writes shared request and protocol-base records.",
  LibTimelockable:
    "Queues and executes delayed governance actions through the timelock.",
  LibTokenMetadata:
    "Reads and updates the shared token metadata record.",
  LibDiamond:
    "Owns diamond-cut state, facet selectors, and loupe/introspection data.",
};

function listSolidityFiles(dirPath: string): string[] {
  return readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      return listSolidityFiles(fullPath);
    }

    return entry.name.endsWith(".sol") ? [fullPath] : [];
  });
}

function toPosix(filePath: string) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function toSourceRelativePath(fullPath: string) {
  return toPosix(path.relative(CONTRACTS_SRC_ROOT, fullPath));
}

function readFoundryProfileVersions() {
  const config = readFileSync(FOUNDRY_CONFIG_PATH, "utf8");
  const profileVersions: Record<string, string> = {};
  let currentProfile: string | null = null;

  for (const line of config.split(/\r?\n/)) {
    const profileMatch = line.match(/^\[profile\.(.+)]$/);

    if (profileMatch) {
      currentProfile = profileMatch[1];
      continue;
    }

    const solcMatch = line.match(/^solc = "([^"]+)"$/);

    if (solcMatch && currentProfile) {
      profileVersions[currentProfile] = solcMatch[1];
    }
  }

  return profileVersions;
}

function getCompilerDetails(
  sourcePath: string,
  profileVersions: Record<string, string>,
) {
  const compilerProfile = sourcePath.startsWith("diamond-proxy/")
    ? "diamond-proxy"
    : "default";

  return {
    compilerProfile,
    solcVersion: profileVersions[compilerProfile] ?? "",
  };
}

function parseSourceFile(
  fullPath: string,
  profileVersions: Record<string, string>,
): ParsedSourceFile {
  const sourcePath = toSourceRelativePath(fullPath);
  const content = readFileSync(fullPath, "utf8");
  const ast = parser.parse(content, {
    comments: true,
    loc: true,
    range: true,
    tolerant: true,
  }) as unknown as ParserNode;

  return {
    path: sourcePath,
    fullPath,
    content,
    lines: content.split(/\r?\n/),
    ast,
    comments: (ast.comments as ParserComment[] | undefined) ?? [],
    imports: ((ast.children as ParserNode[] | undefined) ?? [])
      .filter((child) => child.type === "ImportDirective")
      .map((child) => child.path)
      .filter((importPath): importPath is string => Boolean(importPath))
      .map((importPath) => resolveImportPath(sourcePath, importPath))
      .filter((importPath): importPath is string => Boolean(importPath)),
    ...getCompilerDetails(sourcePath, profileVersions),
  };
}

function resolveImportPath(sourcePath: string, importPath: string) {
  if (importPath.startsWith(".")) {
    return path.posix.normalize(
      path.posix.join(path.posix.dirname(sourcePath), importPath),
    );
  }

  const odaPrefix = "@odaplatform/da-fact-smartcontracts/contracts/";

  if (importPath.startsWith(odaPrefix)) {
    return importPath.slice(odaPrefix.length);
  }

  return null;
}

function getContractDefinitions(files: ParsedSourceFile[]) {
  const definitions = new Map<string, ContractDefinitionInfo>();

  for (const file of files) {
    for (const child of (file.ast.children as ParserNode[] | undefined) ?? []) {
      if (child.type !== "ContractDefinition" || !child.name) {
        continue;
      }

      definitions.set(child.name, {
        name: child.name,
        kind: (child.kind as "contract" | "interface" | "library") ?? "contract",
        filePath: file.path,
        baseContracts: ((child.baseContracts as ParserNode[] | undefined) ?? [])
          .map((baseContract) => {
            const baseName = baseContract.baseName as ParserNode | undefined;
            return (baseName?.namePath as string | undefined) ?? "";
          })
          .filter(Boolean),
        node: child,
      });
    }
  }

  return definitions;
}

function getFileMap(files: ParsedSourceFile[]) {
  return new Map(files.map((file) => [file.path, file]));
}

function getFunctionAndModifierNodes(contract: ContractDefinitionInfo) {
  const subNodes = (contract.node.subNodes as ParserNode[] | undefined) ?? [];

  return {
    functions: subNodes.filter((node) => node.type === "FunctionDefinition"),
    modifiers: subNodes.filter((node) => node.type === "ModifierDefinition"),
  };
}

function getSourceSnippet(file: ParsedSourceFile, node: ParserNode) {
  if (!node.range) {
    return "";
  }

  return file.content.slice(node.range[0], node.range[1] + 1);
}

function typeNameToSignature(typeName: ParserNode | undefined): string {
  if (!typeName) {
    return "";
  }

  if (typeName.type === "ElementaryTypeName") {
    return (typeName.name as string) ?? "";
  }

  if (typeName.type === "UserDefinedTypeName") {
    return (typeName.namePath as string) ?? "";
  }

  if (typeName.type === "ArrayTypeName") {
    const baseType = typeNameToSignature(typeName.baseTypeName as ParserNode);
    return `${baseType}[]`;
  }

  if (typeName.type === "Mapping") {
    const keyType = typeNameToSignature(typeName.keyType as ParserNode);
    const valueType = typeNameToSignature(typeName.valueType as ParserNode);
    return `mapping(${keyType}=>${valueType})`;
  }

  return "";
}

function buildSignatureFromFunctionNode(node: ParserNode) {
  const name = node.name;

  if (!name) {
    return null;
  }

  const parameters = ((node.parameters as ParserNode[] | undefined) ?? []).map(
    (parameter) => typeNameToSignature(parameter.typeName as ParserNode),
  );

  return `${name}(${parameters.join(",")})`;
}

function findFunctionNodeBySignature(
  contract: ContractDefinitionInfo,
  signature: string,
) {
  return getFunctionAndModifierNodes(contract).functions.find(
    (node) => buildSignatureFromFunctionNode(node) === signature,
  );
}

function findLeadingComment(
  comments: ParserComment[],
  node: ParserNode,
): ParserComment | null {
  if (!node.loc) {
    return null;
  }

  const startLine = node.loc.start.line;

  return [...comments]
    .reverse()
    .find(
      (comment) =>
        comment.type === "BlockComment" &&
        comment.loc &&
        comment.loc.end.line < startLine &&
        startLine - comment.loc.end.line <= 2,
    ) ?? null;
}

function parseNatSpec(
  comment: ParserComment | null | undefined,
): NatSpecInfo | null {
  if (!comment) {
    return null;
  }

  const parsed: NatSpecInfo = {
    dev: [],
    params: {},
    returns: {},
  };

  for (const rawLine of comment.value.split(/\r?\n/)) {
    const line = rawLine.replace(/^\s*\*?\s?/, "").trim();

    if (!line.startsWith("@")) {
      continue;
    }

    if (line.startsWith("@notice ")) {
      parsed.notice = line.slice("@notice ".length).trim();
      continue;
    }

    if (line.startsWith("@dev ")) {
      parsed.dev?.push(line.slice("@dev ".length).trim());
      continue;
    }

    if (line.startsWith("@param ")) {
      const [name, ...descriptionParts] = line.slice("@param ".length).split(" ");
      parsed.params![name] = descriptionParts.join(" ").trim();
      continue;
    }

    if (line.startsWith("@return ")) {
      const [name, ...descriptionParts] = line.slice("@return ".length).split(" ");
      parsed.returns![name] = descriptionParts.join(" ").trim();
    }
  }

  const hasValues = Boolean(
    parsed.notice ||
      parsed.dev?.length ||
      Object.keys(parsed.params ?? {}).length ||
      Object.keys(parsed.returns ?? {}).length,
  );

  if (!hasValues) {
    return null;
  }

  return {
    notice: parsed.notice,
    dev: parsed.dev?.length ? parsed.dev : undefined,
    params: Object.keys(parsed.params ?? {}).length ? parsed.params : undefined,
    returns: Object.keys(parsed.returns ?? {}).length
      ? parsed.returns
      : undefined,
  };
}

function mergeNatSpec(
  inheritedNatSpec: NatSpecInfo | null,
  directNatSpec: NatSpecInfo | null,
): NatSpecInfo | null {
  if (!inheritedNatSpec && !directNatSpec) {
    return null;
  }

  return {
    notice: directNatSpec?.notice ?? inheritedNatSpec?.notice,
    dev:
      directNatSpec?.dev && directNatSpec.dev.length > 0
        ? directNatSpec.dev
        : inheritedNatSpec?.dev,
    params:
      directNatSpec?.params && Object.keys(directNatSpec.params).length > 0
        ? directNatSpec.params
        : inheritedNatSpec?.params,
    returns:
      directNatSpec?.returns && Object.keys(directNatSpec.returns).length > 0
        ? directNatSpec.returns
        : inheritedNatSpec?.returns,
  };
}

function resolveInterfaceNatSpec(
  contract: ContractDefinitionInfo,
  signature: string,
  contractDefinitions: Map<string, ContractDefinitionInfo>,
  fileMap: Map<string, ParsedSourceFile>,
) {
  for (const baseName of contract.baseContracts) {
    const baseContract = contractDefinitions.get(baseName);

    if (!baseContract) {
      continue;
    }

    const baseNode = findFunctionNodeBySignature(baseContract, signature);

    if (!baseNode) {
      continue;
    }

    const baseFile = fileMap.get(baseContract.filePath);

    if (!baseFile) {
      continue;
    }

    const natspec = parseNatSpec(findLeadingComment(baseFile.comments, baseNode));

    if (natspec) {
      return natspec;
    }
  }

  return null;
}

function extractFunctionCalls(code: string) {
  return Array.from(code.matchAll(/\b([A-Z][A-Za-z0-9_]*)\.(\w+)\s*\(/g)).map(
    (match) => ({
      libraryName: match[1],
      memberName: match[2],
    }),
  );
}

function getLineText(lines: string[], lineNumber: number) {
  return lines[lineNumber - 1] ?? "";
}

function buildResolvedCall(
  file: ParsedSourceFile,
  modifierNode: ParserNode,
  invocationNode?: ParserNode,
) {
  const statements = (modifierNode.body?.statements as ParserNode[] | undefined) ?? [];
  const firstStatement = statements[0];
  const expression = firstStatement?.expression as ParserNode | undefined;

  if (!expression) {
    return undefined;
  }

  const resolvedNode =
    expression.type === "FunctionCall" &&
    (expression.expression as ParserNode | undefined)?.type === "Identifier" &&
    (expression.expression as ParserNode | undefined)?.name === "require"
      ? ((expression.arguments as ParserNode[] | undefined) ?? [])[0]
      : expression;

  if (!resolvedNode?.range) {
    return undefined;
  }

  let resolvedCall = file.content
    .slice(resolvedNode.range[0], resolvedNode.range[1] + 1)
    .replace(/\s+/g, " ")
    .trim();

  const parameterNodes = (modifierNode.parameters as ParserNode[] | undefined) ?? [];
  const argumentNodes = (invocationNode?.arguments as ParserNode[] | undefined) ?? [];

  parameterNodes.forEach((parameterNode, index) => {
    const parameterName = parameterNode.name;
    const argumentNode = argumentNodes[index];

    if (!parameterName || !argumentNode?.range) {
      return;
    }

    const argumentText = file.content
      .slice(argumentNode.range[0], argumentNode.range[1] + 1)
      .replace(/\s+/g, " ")
      .trim();
    resolvedCall = resolvedCall.replace(
      new RegExp(`\\b${parameterName}\\b`, "g"),
      argumentText,
    );
  });

  return resolvedCall;
}

function classifyModifierType(resolvedCall?: string): ModifierType {
  if (!resolvedCall) {
    return "other";
  }

  if (resolvedCall.includes("_hasRole") || resolvedCall.includes("getRoleAdmin")) {
    return "role";
  }

  if (resolvedCall.includes("Pausable") || resolvedCall.includes("paused")) {
    return "pause";
  }

  if (resolvedCall.includes("ManagedAccount") || resolvedCall.includes("StopCodes")) {
    return "account";
  }

  if (resolvedCall.includes("ManagedToken") || resolvedCall.includes("Token")) {
    return "token";
  }

  return "other";
}

function buildModifierChain(
  contract: ContractDefinitionInfo,
  fileMap: Map<string, ParsedSourceFile>,
  functionNode: ParserNode,
) {
  const file = fileMap.get(contract.filePath);

  if (!file) {
    return [];
  }

  const modifierDefinitions = new Map(
    getFunctionAndModifierNodes(contract).modifiers
      .filter((modifier) => Boolean(modifier.name))
      .map((modifier) => [modifier.name as string, modifier]),
  );

  return ((functionNode.modifiers as ParserNode[] | undefined) ?? []).map(
    (modifier): ModifierInfo => {
      const modifierDefinition = modifierDefinitions.get(modifier.name as string);
      const resolvedCall = modifierDefinition
        ? buildResolvedCall(file, modifierDefinition, modifier)
        : undefined;

      return {
        name: modifier.name as string,
        filePath: contract.filePath,
        line: modifier.loc?.start.line ?? 1,
        resolvedCall,
        type: classifyModifierType(resolvedCall),
      };
    },
  );
}

function findLibraryFunctionEntry(
  libraryName: string,
  functionName: string,
  contractDefinitions: Map<string, ContractDefinitionInfo>,
) {
  const libraryContract = contractDefinitions.get(libraryName);

  if (!libraryContract || libraryContract.kind !== "library") {
    return null;
  }

  return getFunctionAndModifierNodes(libraryContract).functions.find(
    (node) => node.name === functionName,
  );
}

function inferStorageAccessMode(lineText: string, fieldName: string): StorageAccessMode {
  const writePattern = new RegExp(`${fieldName}(\\[[^\\]]+\\])?\\s*(\\+=|-=|=|\\+\\+|--)`);

  return writePattern.test(lineText) ? "write" : "read";
}

function collectStorageAccessFromNode(
  code: string,
  file: ParsedSourceFile,
  containerName: string,
) {
  const directAccesses: Array<{
    libraryName: string;
    fieldName: string;
    lineNumber: number;
    access: StorageAccessMode;
  }> = [];

  for (const match of code.matchAll(/\b([A-Z][A-Za-z0-9_]*)\.ref\(\)\.(_[A-Za-z0-9_]+)/g)) {
    const matchIndex = match.index ?? 0;
    const lineNumber = file.content.slice(0, matchIndex).split("\n").length;
    const lineText = getLineText(file.lines, lineNumber);

    directAccesses.push({
      libraryName: match[1],
      fieldName: match[2],
      lineNumber,
      access: inferStorageAccessMode(lineText, match[2]),
    });
  }

  for (const match of code.matchAll(/\bref\(\)\.(_[A-Za-z0-9_]+)/g)) {
    const matchIndex = match.index ?? 0;
    const lineNumber = file.content.slice(0, matchIndex).split("\n").length;
    const lineText = getLineText(file.lines, lineNumber);

    directAccesses.push({
      libraryName: containerName,
      fieldName: match[1],
      lineNumber,
      access: inferStorageAccessMode(lineText, match[1]),
    });
  }

  return directAccesses;
}

function buildStorageStructMap(
  contractDefinitions: Map<string, ContractDefinitionInfo>,
  fileMap: Map<string, ParsedSourceFile>,
) {
  const structMap = new Map<
    string,
    { filePath: string; structName: string; fields: Set<string> }
  >();

  for (const contract of contractDefinitions.values()) {
    if (contract.kind !== "library") {
      continue;
    }

    const structNode = ((contract.node.subNodes as ParserNode[] | undefined) ?? []).find(
      (node) =>
        node.type === "StructDefinition" &&
        typeof node.name === "string" &&
        node.name.endsWith("Storage"),
    );

    if (!structNode) {
      continue;
    }

    const fieldNames = new Set(
      ((structNode.members as ParserNode[] | undefined) ?? [])
        .map((member) => member.name)
        .filter((name): name is string => typeof name === "string"),
    );

    structMap.set(contract.name, {
      filePath: contract.filePath,
      structName: structNode.name as string,
      fields: fieldNames,
    });
  }

  return structMap;
}

function buildPrimaryFacetFileMap(
  contractDefinitions: Map<string, ContractDefinitionInfo>,
) {
  return new Map(
    [...contractDefinitions.values()]
      .filter((contract) => contract.kind === "contract")
      .map((contract) => [contract.name, contract.filePath]),
  );
}

function buildFunctionBodies(
  contractDefinitions: Map<string, ContractDefinitionInfo>,
  fileMap: Map<string, ParsedSourceFile>,
) {
  const functionBodies: SourceMetadataArtifacts["functionBodies"] = {};
  const natspec: SourceMetadataArtifacts["natspec"] = {};
  const modifierChains: SourceMetadataArtifacts["modifierChains"] = {};

  for (const facet of getAllFacets()) {
    const contract = contractDefinitions.get(facet.name);

    if (!contract) {
      continue;
    }

    const file = fileMap.get(contract.filePath);

    if (!file) {
      continue;
    }

    const methodEntries = [...facet.readMethods, ...facet.writeMethods];

    functionBodies[facet.name] = {};
    natspec[facet.name] = {};
    modifierChains[facet.name] = {};

    for (const method of methodEntries) {
      const functionNode = findFunctionNodeBySignature(contract, method.signature);

      if (!functionNode || !functionNode.loc) {
        continue;
      }

      functionBodies[facet.name][method.signature] = {
        body: getSourceSnippet(file, functionNode),
        startLine: functionNode.loc.start.line,
        endLine: functionNode.loc.end.line,
        filePath: contract.filePath,
      };

      const directNatSpec = parseNatSpec(findLeadingComment(file.comments, functionNode));
      const inheritedNatSpec = resolveInterfaceNatSpec(
        contract,
        method.signature,
        contractDefinitions,
        fileMap,
      );
      const resolvedNatSpec = mergeNatSpec(inheritedNatSpec, directNatSpec);

      if (resolvedNatSpec) {
        natspec[facet.name][method.signature] = resolvedNatSpec;
      }

      const chain = buildModifierChain(contract, fileMap, functionNode);

      if (chain.length > 0) {
        modifierChains[facet.name][method.signature] = chain;
      }
    }
  }

  return { functionBodies, natspec, modifierChains };
}

function getCandidateProofFiles(
  facetName: string,
  primaryFacetFileMap: Map<string, string>,
  fileMap: Map<string, ParsedSourceFile>,
) {
  const primaryFilePath = primaryFacetFileMap.get(facetName);

  if (!primaryFilePath) {
    return [];
  }

  const visited = new Set<string>();
  const queue = [primaryFilePath];
  const candidates: ParsedSourceFile[] = [];

  while (queue.length > 0) {
    const currentPath = queue.shift();

    if (!currentPath || visited.has(currentPath)) {
      continue;
    }

    visited.add(currentPath);
    const currentFile = fileMap.get(currentPath);

    if (!currentFile) {
      continue;
    }

    candidates.push(currentFile);

    for (const importPath of currentFile.imports) {
      if (!visited.has(importPath)) {
        queue.push(importPath);
      }
    }
  }

  return candidates;
}

function findSmallestEnclosingBlock(
  file: ParsedSourceFile,
  lineNumber: number,
) {
  const matches: Array<{ startLine: number; endLine: number }> = [];

  parser.visit(file.ast, {
    FunctionDefinition(node) {
      const parsedNode = node as unknown as ParserNode;

      if (
        parsedNode.loc &&
        parsedNode.loc.start.line <= lineNumber &&
        parsedNode.loc.end.line >= lineNumber
      ) {
        matches.push({
          startLine: parsedNode.loc.start.line,
          endLine: parsedNode.loc.end.line,
        });
      }
    },
    ModifierDefinition(node) {
      const parsedNode = node as unknown as ParserNode;

      if (
        parsedNode.loc &&
        parsedNode.loc.start.line <= lineNumber &&
        parsedNode.loc.end.line >= lineNumber
      ) {
        matches.push({
          startLine: parsedNode.loc.start.line,
          endLine: parsedNode.loc.end.line,
        });
      }
    },
  });

  return matches.sort(
    (left, right) =>
      left.endLine - left.startLine - (right.endLine - right.startLine),
  )[0];
}

function extractSnippet(
  file: ParsedSourceFile,
  lineNumber: number,
  before = 1,
  after = 3,
) {
  const enclosingBlock = findSmallestEnclosingBlock(file, lineNumber);

  if (enclosingBlock) {
    return {
      startLine: enclosingBlock.startLine,
      endLine: enclosingBlock.endLine,
      snippet: file.lines
        .slice(enclosingBlock.startLine - 1, enclosingBlock.endLine)
        .join("\n"),
    };
  }

  const startLine = Math.max(1, lineNumber - before);
  const endLine = Math.min(file.lines.length, lineNumber + after);

  return {
    startLine,
    endLine,
    snippet: file.lines.slice(startLine - 1, endLine).join("\n"),
  };
}

function buildDependencyProofs(
  primaryFacetFileMap: Map<string, string>,
  fileMap: Map<string, ParsedSourceFile>,
) {
  const dependencyProofs: SourceMetadataArtifacts["dependencyProofs"] = {};

  for (const [facetName, metadata] of FACET_REGISTRY.entries()) {
    const dependencies = metadata.dependencies ?? [];

    if (dependencies.length === 0) {
      continue;
    }

    dependencyProofs[facetName] = {};

    const candidateFiles = getCandidateProofFiles(
      facetName,
      primaryFacetFileMap,
      fileMap,
    );

    for (const dependency of dependencies) {
      const hint = PROOF_HINTS[dependency.target];

      if (!hint) {
        continue;
      }

      const matchingFile =
        (hint.filePath
          ? candidateFiles.find((file) => file.path === hint.filePath)
          : null) ??
        candidateFiles.find((file) =>
          hint.patterns.some((pattern) => file.content.includes(pattern)),
        );

      if (!matchingFile) {
        continue;
      }

      const matchedPattern = hint.patterns.find((pattern) =>
        matchingFile.content.includes(pattern),
      );

      if (!matchedPattern) {
        continue;
      }

      const matchIndex = matchingFile.content.indexOf(matchedPattern);
      const lineNumber = matchingFile.content
        .slice(0, matchIndex)
        .split("\n").length;
      const snippet = extractSnippet(
        matchingFile,
        lineNumber,
        hint.before,
        hint.after,
      );

      dependencyProofs[facetName][dependency.target] = {
        filePath: matchingFile.path,
        startLine: snippet.startLine,
        endLine: snippet.endLine,
        snippet: snippet.snippet,
        explanation: dependency.relationship,
      };
    }
  }

  return dependencyProofs;
}

function buildLibraryCrossReferences(
  primaryFacetFileMap: Map<string, string>,
  fileMap: Map<string, ParsedSourceFile>,
) {
  const references: SourceMetadataArtifacts["libraryCrossReferences"] = {};

  for (const [facetName, metadata] of FACET_REGISTRY.entries()) {
    const primaryFilePath = primaryFacetFileMap.get(facetName);
    const primaryFile = primaryFilePath ? fileMap.get(primaryFilePath) : null;

    if (!primaryFile) {
      continue;
    }

    for (const importPath of primaryFile.imports) {
      if (!importPath.startsWith("libraries/")) {
        continue;
      }

      const libraryName = path.posix.basename(importPath, ".sol");
      const usageSummary =
        LIBRARY_USAGE_SUMMARIES[libraryName] ?? metadata.dependencies?.[0]?.relationship ?? "Referenced by the facet source.";

      if (!references[libraryName]) {
        const libraryFile = fileMap.get(importPath);

        if (!libraryFile) {
          continue;
        }

        references[libraryName] = {
          libraryName,
          filePath: importPath,
          compilerProfile: libraryFile.compilerProfile,
          solcVersion: libraryFile.solcVersion,
          usages: [],
        };
      }

      references[libraryName].usages.push({
        facetName,
        displayName: metadata.displayName,
        usageSummary,
      });
    }
  }

  for (const reference of Object.values(references)) {
    reference.usages.sort((left, right) =>
      left.displayName.localeCompare(right.displayName),
    );
  }

  return references;
}

function buildStorageAccess(
  contractDefinitions: Map<string, ContractDefinitionInfo>,
  primaryFacetFileMap: Map<string, string>,
  fileMap: Map<string, ParsedSourceFile>,
) {
  const structMap = buildStorageStructMap(contractDefinitions, fileMap);
  const storageAccess: SourceMetadataArtifacts["storageAccess"] = {};

  const collectFromEntry = (
    libraryName: string,
    functionName: string,
    visited: Set<string>,
    accumulator: Map<string, Map<string, StorageAccessMode>>,
  ) => {
    const cacheKey = `${libraryName}.${functionName}`;

    if (visited.has(cacheKey)) {
      return;
    }

    visited.add(cacheKey);

    const functionNode = findLibraryFunctionEntry(
      libraryName,
      functionName,
      contractDefinitions,
    );
    const libraryContract = contractDefinitions.get(libraryName);

    if (!functionNode || !libraryContract) {
      return;
    }

    const file = fileMap.get(libraryContract.filePath);

    if (!file) {
      return;
    }

    const code = getSourceSnippet(file, functionNode);

    for (const access of collectStorageAccessFromNode(code, file, libraryName)) {
      if (!structMap.has(access.libraryName)) {
        continue;
      }

      const libraryFields =
        accumulator.get(access.libraryName) ?? new Map<string, StorageAccessMode>();
      const currentMode = libraryFields.get(access.fieldName);

      libraryFields.set(
        access.fieldName,
        currentMode === "write" || access.access === "write" ? "write" : "read",
      );
      accumulator.set(access.libraryName, libraryFields);
    }

    for (const call of extractFunctionCalls(code)) {
      if (call.memberName === "ref") {
        continue;
      }

      collectFromEntry(call.libraryName, call.memberName, visited, accumulator);
    }
  };

  for (const [facetName] of FACET_REGISTRY.entries()) {
    const primaryFilePath = primaryFacetFileMap.get(facetName);
    const contract = contractDefinitions.get(facetName);
    const primaryFile = primaryFilePath ? fileMap.get(primaryFilePath) : null;

    if (!primaryFile || !contract) {
      continue;
    }

    const storageAccumulator = new Map<string, Map<string, StorageAccessMode>>();
    const { functions } = getFunctionAndModifierNodes(contract);

    for (const functionNode of functions) {
      const code = getSourceSnippet(primaryFile, functionNode);

      for (const call of extractFunctionCalls(code)) {
        if (call.memberName === "ref") {
          continue;
        }

        collectFromEntry(
          call.libraryName,
          call.memberName,
          new Set<string>(),
          storageAccumulator,
        );
      }

      for (const modifier of (functionNode.modifiers as ParserNode[] | undefined) ?? []) {
        const modifierDefinition = getFunctionAndModifierNodes(contract).modifiers.find(
          (node) => node.name === modifier.name,
        );

        if (!modifierDefinition) {
          continue;
        }

        const modifierCode = getSourceSnippet(primaryFile, modifierDefinition);

        for (const call of extractFunctionCalls(modifierCode)) {
          if (call.memberName === "ref") {
            continue;
          }

          collectFromEntry(
            call.libraryName,
            call.memberName,
            new Set<string>(),
            storageAccumulator,
          );
        }
      }
    }

    storageAccess[facetName] = [...storageAccumulator.entries()]
      .map(([libraryName, fields]) => {
        const structInfo = structMap.get(libraryName);

        if (!structInfo) {
          return null;
        }

        return {
          libraryName,
          filePath: structInfo.filePath,
          structName: structInfo.structName,
          fields: [...fields.entries()].map(([name, access]) => ({
            name,
            access,
          })),
        } satisfies StorageAccessInfo;
      })
      .filter((entry): entry is StorageAccessInfo => entry !== null)
      .sort((left, right) => left.libraryName.localeCompare(right.libraryName));
  }

  return storageAccess;
}

function buildImportGraph(files: ParsedSourceFile[]) {
  const importedByMap = new Map<string, string[]>();

  for (const file of files) {
    for (const importPath of file.imports) {
      importedByMap.set(importPath, [
        ...(importedByMap.get(importPath) ?? []),
        file.path,
      ]);
    }
  }

  return Object.fromEntries(
    files.map((file) => [
      file.path,
      {
        filePath: file.path,
        imports: [...file.imports].sort(),
        importedBy: [...(importedByMap.get(file.path) ?? [])].sort(),
      } satisfies ImportGraphEntry,
    ]),
  );
}

async function buildSourceFiles(files: ParsedSourceFile[]) {
  const entries = await Promise.all(
    files.map(async (file) => {
      const highlightedHtml = await codeToHtml(file.content, {
        lang: "solidity",
        theme: SHIKI_THEME,
      });
      const tokenResult = await codeToTokens(file.content, {
        lang: "solidity",
        theme: SHIKI_THEME,
      });

      return [
        file.path,
        {
          path: file.path,
          name: path.posix.basename(file.path),
          content: file.content,
          highlightedHtml,
          tokenLines: tokenResult.tokens as SourceToken[][],
          compilerProfile: file.compilerProfile,
          solcVersion: file.solcVersion,
        } satisfies SourceFileRecord,
      ] as const;
    }),
  );

  return Object.fromEntries(entries);
}

function buildFileTree(files: ParsedSourceFile[]) {
  const root: SourceFileEntry[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let currentEntries = root;
    let currentPath = "";

    for (const [index, part] of parts.entries()) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLeaf = index === parts.length - 1;
      let entry = currentEntries.find((candidate) => candidate.name === part);

      if (!entry) {
        entry = {
          path: currentPath,
          name: part,
          type: isLeaf ? "file" : "directory",
          children: isLeaf ? undefined : [],
          size: isLeaf ? Buffer.byteLength(file.content, "utf8") : undefined,
          solidityVersion: isLeaf
            ? file.content.match(/pragma solidity \^?([^;]+);/)?.[1]
            : undefined,
          compilerProfile: isLeaf ? file.compilerProfile : undefined,
          solcVersion: isLeaf ? file.solcVersion : undefined,
        };
        currentEntries.push(entry);
      }

      if (entry.type === "directory") {
        currentEntries = entry.children ?? [];
        entry.children = currentEntries;
      }
    }
  }

  const sortEntries = (entries: SourceFileEntry[]): SourceFileEntry[] =>
    entries
      .map((entry) =>
        entry.type === "directory" && entry.children
          ? { ...entry, children: sortEntries(entry.children) }
          : entry,
      )
      .sort((left, right) => {
        if (left.type !== right.type) {
          return left.type === "directory" ? -1 : 1;
        }

        return left.name.localeCompare(right.name);
      });

  return sortEntries(root);
}

export async function buildSourceMetadata(): Promise<SourceMetadataArtifacts> {
  const profileVersions = readFoundryProfileVersions();
  const files = listSolidityFiles(CONTRACTS_SRC_ROOT)
    .map((filePath) => parseSourceFile(filePath, profileVersions))
    .sort((left, right) => left.path.localeCompare(right.path));
  const fileMap = getFileMap(files);
  const contractDefinitions = getContractDefinitions(files);
  const primaryFacetFileMap = buildPrimaryFacetFileMap(contractDefinitions);
  const { functionBodies, natspec, modifierChains } = buildFunctionBodies(
    contractDefinitions,
    fileMap,
  );
  const dependencyProofs = buildDependencyProofs(primaryFacetFileMap, fileMap);
  const libraryCrossReferences = buildLibraryCrossReferences(
    primaryFacetFileMap,
    fileMap,
  );
  const storageAccess = buildStorageAccess(
    contractDefinitions,
    primaryFacetFileMap,
    fileMap,
  );

  return {
    functionBodies,
    natspec,
    modifierChains,
    dependencyProofs,
    libraryCrossReferences,
    storageAccess,
    sourceFiles: await buildSourceFiles(files),
    importGraph: buildImportGraph(files),
    fileTree: buildFileTree(files),
  };
}

export async function writeSourceMetadata() {
  const metadata = await buildSourceMetadata();

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const outputs = {
    "function-bodies.json": metadata.functionBodies,
    "natspec.json": metadata.natspec,
    "modifier-chains.json": metadata.modifierChains,
    "dependency-proofs.json": metadata.dependencyProofs,
    "library-cross-ref.json": metadata.libraryCrossReferences,
    "storage-access.json": metadata.storageAccess,
    "source-files.json": metadata.sourceFiles,
    "file-tree.json": metadata.fileTree,
    "import-graph.json": metadata.importGraph,
  };

  for (const [fileName, payload] of Object.entries(outputs)) {
    writeFileSync(
      path.join(OUTPUT_DIR, fileName),
      `${JSON.stringify(payload, null, 2)}\n`,
      "utf8",
    );
  }

  return metadata;
}

if (import.meta.main) {
  await writeSourceMetadata();
}
