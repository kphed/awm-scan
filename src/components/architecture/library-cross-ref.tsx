import {
  Accordion,
  Badge,
  Box,
  Button,
  HStack,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import type {
  ArchitectureData,
  ArchitectureFacet,
  SharedLibraryReference,
} from "@/lib/contracts";
import { buildSourceExplorerHref } from "@/lib/contracts";

interface LibraryCrossRefProps {
  libraries: SharedLibraryReference[];
  data: ArchitectureData;
  onSelectFacet: (facet: ArchitectureFacet | null) => void;
}

const LibraryCrossRef = ({
  libraries,
  data,
  onSelectFacet,
}: LibraryCrossRefProps) => {
  const facetLookup = new Map(
    data.clusters.flatMap((cluster) =>
      cluster.facets.map((facet) => [facet.name, facet] as const),
    ),
  );

  if (libraries.length === 0) {
    return (
      <Text color="fg.muted">
        Shared-library references are unavailable for this source snapshot.
      </Text>
    );
  }

  return (
    <Stack gap="6">
      <Text color="fg.muted" fontSize="sm" lineHeight="tall">
        Cross-reference of shared Solidity libraries and the facets that rely on
        them. Use this to estimate the upgrade blast radius before touching
        shared internals.
      </Text>

      <Accordion.Root collapsible multiple variant="plain">
        {libraries.map((library) => (
          <Accordion.Item key={library.libraryName} value={library.libraryName}>
            <Accordion.ItemTrigger>
              <HStack flex="1" justify="space-between" align="center" gap="3">
                <Stack gap="1" align="start">
                  <Text fontWeight="semibold">{library.libraryName}</Text>
                  <Text color="fg.muted" fontSize="sm">
                    {library.filePath}
                  </Text>
                </Stack>
                <Badge variant="subtle">{library.usages.length} facets</Badge>
              </HStack>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Stack gap="4">
                  <HStack gap="2" wrap="wrap">
                    <Badge variant="outline">
                      Solidity {library.solcVersion}
                    </Badge>
                    <Badge variant="subtle">
                      Profile {library.compilerProfile}
                    </Badge>
                    <Link
                      as={NextLink}
                      href={buildSourceExplorerHref(library.filePath)}
                      fontSize="sm"
                      textDecoration="underline"
                      textUnderlineOffset="0.2em"
                    >
                      Open in Source Explorer
                    </Link>
                  </HStack>

                  <Stack gap="3">
                    {library.usages.map((usage) => {
                      const facet = facetLookup.get(usage.facetName) ?? null;

                      return (
                        <Box
                          key={`${library.libraryName}-${usage.facetName}`}
                          borderWidth="1px"
                          borderColor="border.subtle"
                          borderRadius="lg"
                          bg="bg.panel"
                          p="4"
                        >
                          <Stack gap="2">
                            <HStack
                              justify="space-between"
                              align="start"
                              gap="3"
                            >
                              <Stack gap="1">
                                <Text fontWeight="medium">
                                  {usage.displayName}
                                </Text>
                                <Text
                                  color="fg.muted"
                                  fontFamily="var(--font-geist-mono)"
                                  fontSize="xs"
                                >
                                  {usage.facetName}
                                </Text>
                              </Stack>
                              {facet ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onSelectFacet(facet)}
                                >
                                  Open module details
                                </Button>
                              ) : null}
                            </HStack>
                            <Text color="fg.muted" fontSize="sm">
                              {usage.usageSummary}
                            </Text>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Stack>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </Stack>
  );
};

export default LibraryCrossRef;
