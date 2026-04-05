"use client";

import {
  Badge,
  Box,
  Card,
  Container,
  HStack,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useDeferredValue, useState } from "react";
import type {
  ImportGraphEntry,
  LineRange,
  SourceFileEntry,
  SourceFileRecord,
  SourceOwner,
} from "@/lib/contracts";
import {
  buildSourceExplorerHref,
  flattenSourceFileTree,
  getDefaultSourcePath,
} from "@/lib/contracts";
import CodeViewer from "./code-viewer";
import FileTree from "./file-tree";
import SearchPanel from "./search-panel";
import StatusBar from "./status-bar";

interface SourceExplorerProps {
  currentPath?: string | null;
  fileTree: SourceFileEntry[];
  importGraph: Record<string, ImportGraphEntry>;
  lineRange?: LineRange | null;
  sourceFiles: Record<string, SourceFileRecord>;
  sourceOwners: Record<string, SourceOwner>;
}

const SourceExplorer = ({
  currentPath,
  fileTree,
  importGraph,
  lineRange,
  sourceFiles,
  sourceOwners,
}: SourceExplorerProps) => {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const allFiles = flattenSourceFileTree(fileTree);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredEntries = normalizedQuery
    ? allFiles.filter((entry) => {
        const sourceFile = sourceFiles[entry.path];

        if (!sourceFile) {
          return false;
        }

        return (
          entry.path.toLowerCase().includes(normalizedQuery) ||
          sourceFile.content.toLowerCase().includes(normalizedQuery)
        );
      })
    : fileTree;
  const resolvedPath =
    (currentPath && sourceFiles[currentPath] ? currentPath : null) ??
    getDefaultSourcePath(sourceFiles);
  const currentFile = resolvedPath ? sourceFiles[resolvedPath] : null;
  const currentOwner = resolvedPath ? sourceOwners[resolvedPath] : undefined;
  const references = resolvedPath ? importGraph[resolvedPath] : undefined;
  const pathSegments = currentFile?.path.split("/") ?? [];

  if (!currentFile) {
    return (
      <Container maxW="8xl" py={{ base: "6", md: "8" }}>
        <Text color="fg.muted">
          Source explorer data is unavailable for this workspace right now.
        </Text>
      </Container>
    );
  }

  return (
    <Container maxW="8xl" py={{ base: "6", md: "8" }}>
      <Stack gap="6">
        <Stack gap="3">
          <HStack justify="space-between" align="start" gap="4" wrap="wrap">
            <Stack gap="2">
              <Heading size="2xl">MONY Source Explorer</Heading>
              <Text color="fg.muted" maxW="4xl">
                Readonly Solidity browser for the extracted MONY contracts,
                compiler-profile context, and source-backed references used by
                the Architecture Map.
              </Text>
            </Stack>
            {currentOwner ? (
              <Link
                href={`https://etherscan.io/address/${currentOwner.address}`}
                target="_blank"
                rel="noreferrer"
                textDecoration="underline"
                textUnderlineOffset="0.2em"
              >
                Open on Etherscan
              </Link>
            ) : null}
          </HStack>

          <HStack gap="2" wrap="wrap" color="fg.muted" fontSize="sm">
            {pathSegments.map((segment, index) => {
              const segmentPath = pathSegments.slice(0, index + 1).join("/");
              const isLeaf = index === pathSegments.length - 1;

              return (
                <HStack key={segmentPath} gap="2">
                  {index > 0 ? <Text>/</Text> : null}
                  {isLeaf ? (
                    <Text>{segment}</Text>
                  ) : (
                    <Link
                      as={NextLink}
                      href={buildSourceExplorerHref(segmentPath)}
                    >
                      {segment}
                    </Link>
                  )}
                </HStack>
              );
            })}
          </HStack>
        </Stack>

        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", lg: "20rem minmax(0, 1fr)" }}
          gap="6"
        >
          <Stack gap="4">
            <Card.Root borderWidth="1px" borderColor="border.subtle">
              <Card.Body>
                <Stack gap="4">
                  <SearchPanel
                    query={query}
                    resultCount={filteredEntries.length}
                    onQueryChange={setQuery}
                  />
                  <FileTree
                    currentPath={currentFile.path}
                    entries={filteredEntries}
                    lineRange={lineRange}
                  />
                </Stack>
              </Card.Body>
            </Card.Root>
          </Stack>

          <Stack gap="4" minW="0">
            <Card.Root borderWidth="1px" borderColor="border.subtle">
              <Card.Body>
                <Stack gap="4">
                  <HStack
                    justify="space-between"
                    align="start"
                    gap="3"
                    wrap="wrap"
                  >
                    <Stack gap="1">
                      <Heading size="md">{currentFile.name}</Heading>
                      <Text color="fg.muted" fontSize="sm">
                        {currentOwner
                          ? `${currentOwner.displayName} • ${currentOwner.technicalName}`
                          : "Shared library or interface"}
                      </Text>
                    </Stack>
                    <HStack gap="2" wrap="wrap">
                      <Badge variant="subtle">
                        Solidity {currentFile.solcVersion}
                      </Badge>
                      <Badge variant="outline">
                        Profile {currentFile.compilerProfile}
                      </Badge>
                    </HStack>
                  </HStack>
                  <CodeViewer file={currentFile} highlightRange={lineRange} />
                </Stack>
              </Card.Body>
            </Card.Root>

            <Card.Root borderWidth="1px" borderColor="border.subtle">
              <Card.Body>
                <Stack gap="4">
                  <Box>
                    <Text fontWeight="semibold" mb="2">
                      Imports
                    </Text>
                    <HStack gap="2" wrap="wrap">
                      {(references?.imports ?? []).length > 0 ? (
                        (references?.imports ?? []).map((importPath) => (
                          <Link
                            key={importPath}
                            as={NextLink}
                            href={buildSourceExplorerHref(importPath)}
                            fontSize="sm"
                            textDecoration="underline"
                            textUnderlineOffset="0.2em"
                          >
                            {importPath}
                          </Link>
                        ))
                      ) : (
                        <Text color="fg.muted" fontSize="sm">
                          No local Solidity imports.
                        </Text>
                      )}
                    </HStack>
                  </Box>

                  <Box>
                    <Text fontWeight="semibold" mb="2">
                      Referenced by
                    </Text>
                    <HStack gap="2" wrap="wrap">
                      {(references?.importedBy ?? []).length > 0 ? (
                        (references?.importedBy ?? []).map((importPath) => (
                          <Link
                            key={importPath}
                            as={NextLink}
                            href={buildSourceExplorerHref(importPath)}
                            fontSize="sm"
                            textDecoration="underline"
                            textUnderlineOffset="0.2em"
                          >
                            {importPath}
                          </Link>
                        ))
                      ) : (
                        <Text color="fg.muted" fontSize="sm">
                          No local files reference this module directly.
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </Stack>
              </Card.Body>
            </Card.Root>

            <StatusBar file={currentFile} lineRange={lineRange} />
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default SourceExplorer;
