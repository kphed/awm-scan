import {
  Badge,
  Box,
  Button,
  Card,
  Collapsible,
  HStack,
  Link,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useMemo, useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import type { ArchitectureData, ArchitectureFacet } from "@/lib/contracts";
import { buildSourceExplorerHref } from "@/lib/contracts";
import { useDependencyHighlight } from "@/hooks/use-dependency-highlight";

interface DependencyViewProps {
  data: ArchitectureData;
  onSelectFacet: (facet: ArchitectureFacet | null) => void;
}

const DependencyView = ({ data, onSelectFacet }: DependencyViewProps) => {
  const [focusedFacetName, setFocusedFacetName] = useState<string | null>(null);
  const { blastRadius, facetLookup, highlighted, relationships } =
    useDependencyHighlight(data, focusedFacetName);
  const relationshipsByTarget = useMemo(() => {
    const map = new Map<string, typeof relationships>();

    for (const relationship of relationships) {
      map.set(relationship.target, [
        ...(map.get(relationship.target) ?? []),
        relationship,
      ]);
    }

    return map;
  }, [relationships]);
  const selectedRelationshipFacet = focusedFacetName
    ? (facetLookup.get(focusedFacetName) ?? null)
    : null;

  return (
    <Stack gap="6">
      <Text color="fg.muted" fontSize="sm" lineHeight="tall">
        Authored dependency relationships for upgrade blast-radius analysis.
        Select a module to see the facets it relies on and the modules that rely
        on it in return.
      </Text>

      {selectedRelationshipFacet ? (
        <Card.Root borderWidth="1px" borderColor="blue.subtle" bg="bg.subtle">
          <Card.Body>
            <Stack gap="3">
              <HStack justify="space-between" align="start" gap="3" wrap="wrap">
                <Stack gap="1">
                  <Text fontWeight="semibold">
                    Dependency relationships:{" "}
                    {selectedRelationshipFacet.displayName}
                  </Text>
                  <Text color="fg.muted" fontSize="sm">
                    Modifying or removing this module is operationally connected
                    to{" "}
                    <Text as="span" fontWeight="semibold" color="fg">
                      {blastRadius.affectedFacets} facets
                    </Text>{" "}
                    across{" "}
                    <Text as="span" fontWeight="semibold" color="fg">
                      {blastRadius.affectedClusters} clusters
                    </Text>
                    .
                  </Text>
                </Stack>

                <HStack gap="2" wrap="wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectFacet(selectedRelationshipFacet)}
                  >
                    Open module details
                  </Button>
                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={() => setFocusedFacetName(null)}
                  >
                    Clear dependency filter
                  </Button>
                </HStack>
              </HStack>

              {relationships.length > 0 ? (
                <Stack gap="2">
                  {relationships.map((relationship) => (
                    <HStack
                      key={`${relationship.source}-${relationship.target}-${relationship.relationship}`}
                      align="start"
                      gap="2"
                      flexWrap="wrap"
                    >
                      <Badge
                        colorPalette={
                          relationship.direction === "uses" ? "green" : "orange"
                        }
                        variant="subtle"
                      >
                        {relationship.direction === "uses" ? "Uses" : "Used by"}
                      </Badge>
                      <Text fontSize="sm" fontWeight="medium">
                        {relationship.targetDisplayName}
                      </Text>
                      <Text color="fg.muted" fontSize="sm">
                        {relationship.relationship}
                      </Text>
                    </HStack>
                  ))}
                </Stack>
              ) : (
                <Text color="fg.muted" fontSize="sm">
                  No authored dependency relationships are listed for this
                  module yet.
                </Text>
              )}
            </Stack>
          </Card.Body>
        </Card.Root>
      ) : null}

      <Stack gap="6">
        {data.clusters.map((cluster) => {
          const visibleFacets = selectedRelationshipFacet
            ? cluster.facets.filter((facet) => highlighted.has(facet.name))
            : cluster.facets;

          if (visibleFacets.length === 0) {
            return null;
          }

          return (
            <Stack key={cluster.id} gap="4">
              <Stack gap="1">
                <Text fontWeight="semibold">{cluster.label}</Text>
                <Text color="fg.muted" fontSize="sm">
                  {cluster.subtitle}
                </Text>
              </Stack>

              <Stack gap="3">
                {visibleFacets.map((facet) => {
                  const isSelected = focusedFacetName === facet.name;
                  const facetRelationships =
                    relationshipsByTarget.get(facet.name) ?? [];
                  const isConnected =
                    highlighted.has(facet.name) && !isSelected;
                  const borderColor = isSelected
                    ? "blue.300"
                    : facetRelationships.some(
                          (relationship) => relationship.direction === "uses",
                        )
                      ? "green.300"
                      : facetRelationships.some(
                            (relationship) =>
                              relationship.direction === "used-by",
                          )
                        ? "orange.300"
                        : "border.subtle";

                  return (
                    <Card.Root
                      key={facet.name}
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={isSelected ? "bg.subtle" : "bg.panel"}
                      shadow={isSelected || isConnected ? "sm" : "xs"}
                      transition="border-color 0.2s ease, background 0.2s ease"
                    >
                      <Card.Body>
                        <Stack gap="3">
                          <HStack justify="space-between" align="start" gap="3">
                            <Stack gap="1" align="start">
                              <Button
                                variant="ghost"
                                justifyContent="flex-start"
                                height="auto"
                                px="0"
                                py="0"
                                onClick={() =>
                                  setFocusedFacetName((current) =>
                                    current === facet.name ? null : facet.name,
                                  )
                                }
                              >
                                <Badge
                                  colorPalette={facet.colorPalette}
                                  variant="surface"
                                >
                                  {facet.displayName}
                                </Badge>
                              </Button>
                              <Text
                                color="fg.muted"
                                fontFamily="var(--font-geist-mono)"
                                fontSize="xs"
                              >
                                {facet.name}
                              </Text>
                            </Stack>

                            {isSelected ? (
                              <Badge colorPalette="blue" variant="solid">
                                Focused
                              </Badge>
                            ) : null}
                          </HStack>

                          {facetRelationships.length > 0 ? (
                            <>
                              <Separator />
                              <Stack gap="2">
                                {facetRelationships.map((relationship) => (
                                  <Stack
                                    key={`${facet.name}-${relationship.direction}-${relationship.source}-${relationship.relationship}`}
                                    gap="2"
                                    borderWidth="1px"
                                    borderColor="border.subtle"
                                    borderRadius="lg"
                                    bg="bg.canvas"
                                    p="3"
                                  >
                                    <HStack
                                      align="start"
                                      gap="2"
                                      flexWrap="wrap"
                                    >
                                      <Badge
                                        colorPalette={
                                          relationship.direction === "uses"
                                            ? "green"
                                            : "orange"
                                        }
                                        variant="subtle"
                                      >
                                        {relationship.direction === "uses"
                                          ? "Selected uses this"
                                          : "Uses selected"}
                                      </Badge>
                                      {relationship.type ? (
                                        <Badge variant="outline">
                                          {relationship.type}
                                        </Badge>
                                      ) : null}
                                      <Text color="fg.muted" fontSize="sm">
                                        {relationship.relationship}
                                      </Text>
                                    </HStack>

                                    {relationship.proof ? (
                                      <Collapsible.Root unmountOnExit>
                                        <Collapsible.Trigger
                                          display="flex"
                                          justifyContent="space-between"
                                          alignItems="center"
                                          width="full"
                                          borderWidth="1px"
                                          borderColor="border.subtle"
                                          borderRadius="md"
                                          px="3"
                                          py="2"
                                        >
                                          <Text fontSize="sm">
                                            Proof snippet
                                          </Text>
                                          <Collapsible.Indicator
                                            transition="transform 0.2s ease"
                                            _open={{
                                              transform: "rotate(180deg)",
                                            }}
                                          >
                                            <LuChevronDown />
                                          </Collapsible.Indicator>
                                        </Collapsible.Trigger>
                                        <Collapsible.Content>
                                          <Stack gap="2" pt="3">
                                            <Text
                                              color="fg.muted"
                                              fontSize="sm"
                                            >
                                              {relationship.proof.explanation}
                                            </Text>
                                            <Card.Root
                                              borderWidth="1px"
                                              borderColor="border.subtle"
                                              bg="bg.panel"
                                            >
                                              <Card.Body>
                                                <Stack gap="2">
                                                  <Text
                                                    color="fg.muted"
                                                    fontSize="sm"
                                                  >
                                                    {
                                                      relationship.proof
                                                        .filePath
                                                    }
                                                    :L
                                                    {
                                                      relationship.proof
                                                        .startLine
                                                    }
                                                    -
                                                    {relationship.proof.endLine}
                                                  </Text>
                                                  <Box overflow="auto">
                                                    <Text
                                                      fontFamily="var(--font-geist-mono)"
                                                      fontSize="xs"
                                                      whiteSpace="pre"
                                                    >
                                                      {
                                                        relationship.proof
                                                          .snippet
                                                      }
                                                    </Text>
                                                  </Box>
                                                  <Link
                                                    as={NextLink}
                                                    href={buildSourceExplorerHref(
                                                      relationship.proof
                                                        .filePath,
                                                      {
                                                        start:
                                                          relationship.proof
                                                            .startLine,
                                                        end: relationship.proof
                                                          .endLine,
                                                      },
                                                    )}
                                                    fontSize="sm"
                                                    textDecoration="underline"
                                                    textUnderlineOffset="0.2em"
                                                  >
                                                    Open in Source Explorer
                                                  </Link>
                                                </Stack>
                                              </Card.Body>
                                            </Card.Root>
                                          </Stack>
                                        </Collapsible.Content>
                                      </Collapsible.Root>
                                    ) : null}
                                  </Stack>
                                ))}
                              </Stack>
                            </>
                          ) : null}
                        </Stack>
                      </Card.Body>
                    </Card.Root>
                  );
                })}
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default DependencyView;
