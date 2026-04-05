import dependencyProofs from "@/contracts/source-metadata/dependency-proofs.json";
import fileTree from "@/contracts/source-metadata/file-tree.json";
import functionBodies from "@/contracts/source-metadata/function-bodies.json";
import importGraph from "@/contracts/source-metadata/import-graph.json";
import libraryCrossReferences from "@/contracts/source-metadata/library-cross-ref.json";
import modifierChains from "@/contracts/source-metadata/modifier-chains.json";
import natspec from "@/contracts/source-metadata/natspec.json";
import sourceFiles from "@/contracts/source-metadata/source-files.json";
import storageAccess from "@/contracts/source-metadata/storage-access.json";
import type {
  DependencyProof,
  ImportGraphEntry,
  MethodSourceInfo,
  ModifierInfo,
  NatSpecInfo,
  SharedLibraryReference,
  SourceFileEntry,
  SourceFileRecord,
  StorageAccessInfo,
} from "./types";

const FUNCTION_BODIES = functionBodies as Record<
  string,
  Record<string, Omit<MethodSourceInfo, "modifiers" | "natspec">>
>;
const NATSPEC = natspec as Record<string, Record<string, NatSpecInfo>>;
const MODIFIER_CHAINS = modifierChains as Record<
  string,
  Record<string, ModifierInfo[]>
>;
const DEPENDENCY_PROOFS = dependencyProofs as Record<
  string,
  Record<string, DependencyProof>
>;
const STORAGE_ACCESS = storageAccess as Record<string, StorageAccessInfo[]>;
const SOURCE_FILES = sourceFiles as Record<string, SourceFileRecord>;
const IMPORT_GRAPH = importGraph as Record<string, ImportGraphEntry>;
const FILE_TREE = fileTree as SourceFileEntry[];
const LIBRARY_CROSS_REFERENCES = libraryCrossReferences as Record<
  string,
  SharedLibraryReference
>;

function inferFacetPrimaryFilePath(facetName: string) {
  const primaryMethod = Object.values(FUNCTION_BODIES[facetName] ?? {})[0];

  if (primaryMethod) {
    return primaryMethod.filePath;
  }

  return Object.keys(SOURCE_FILES).find(
    (filePath) =>
      filePath.endsWith(`/${facetName}.sol`) || filePath === `${facetName}.sol`,
  );
}

export function getFacetMethodSource(facetName: string) {
  return Object.fromEntries(
    Object.entries(FUNCTION_BODIES[facetName] ?? {}).map(
      ([signature, source]) => [
        signature,
        {
          ...source,
          modifiers: MODIFIER_CHAINS[facetName]?.[signature] ?? [],
          natspec: NATSPEC[facetName]?.[signature],
        } satisfies MethodSourceInfo,
      ],
    ),
  );
}

export function getFacetDependencyProofs(facetName: string) {
  return DEPENDENCY_PROOFS[facetName] ?? {};
}

export function getFacetStorageAccess(facetName: string) {
  return STORAGE_ACCESS[facetName] ?? [];
}

export function getFacetRelatedSourceFiles(facetName: string) {
  const primaryFilePath = inferFacetPrimaryFilePath(facetName);

  if (!primaryFilePath) {
    return [];
  }

  const relatedPaths = new Set<string>([primaryFilePath]);
  const queue = [primaryFilePath];

  while (queue.length > 0) {
    const currentPath = queue.shift();

    if (!currentPath) {
      continue;
    }

    for (const importPath of IMPORT_GRAPH[currentPath]?.imports ?? []) {
      if (relatedPaths.has(importPath)) {
        continue;
      }

      relatedPaths.add(importPath);
      queue.push(importPath);
    }
  }

  return [...relatedPaths]
    .map((filePath) => SOURCE_FILES[filePath])
    .filter((file): file is SourceFileRecord => Boolean(file))
    .sort((left, right) => left.path.localeCompare(right.path));
}

export function getSharedLibraryReferences() {
  return Object.values(LIBRARY_CROSS_REFERENCES).sort((left, right) =>
    left.libraryName.localeCompare(right.libraryName),
  );
}

export function getSourceExplorerData() {
  return {
    fileTree: FILE_TREE,
    importGraph: IMPORT_GRAPH,
    sourceFiles: SOURCE_FILES,
  };
}
