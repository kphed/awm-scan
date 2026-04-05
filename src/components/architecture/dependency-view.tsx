import { Badge, Card, HStack, Separator, Stack, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import type { ArchitectureData, ArchitectureFacet } from "@/lib/contracts";
import { useDependencyHighlight } from "@/hooks/use-dependency-highlight";

interface DependencyViewProps {
  data: ArchitectureData;
  selectedFacet: ArchitectureFacet | null;
  onSelectFacet: (facet: ArchitectureFacet | null) => void;
}

const DependencyView = ({
  data,
  selectedFacet,
  onSelectFacet,
}: DependencyViewProps) => {
  const { blastRadius, facetLookup, highlighted, relationships } =
    useDependencyHighlight(data, selectedFacet?.name ?? null);
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
  const selectedFacetName = selectedFacet?.name ?? null;
  const selectedRelationshipFacet = selectedFacetName
    ? (facetLookup.get(selectedFacetName) ?? selectedFacet)
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
        {data.clusters.map((cluster) => (
          <Stack key={cluster.id} gap="4">
            <Stack gap="1">
              <Text fontWeight="semibold">{cluster.label}</Text>
              <Text color="fg.muted" fontSize="sm">
                {cluster.subtitle}
              </Text>
            </Stack>

            <Stack gap="3">
              {cluster.facets.map((facet) => {
                const isSelected = selectedFacetName === facet.name;
                const facetRelationships =
                  relationshipsByTarget.get(facet.name) ?? [];
                const isConnected = highlighted.has(facet.name) && !isSelected;
                const isDimmed =
                  Boolean(selectedFacetName) && !isSelected && !isConnected;
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
                    as="button"
                    textAlign="left"
                    borderWidth="1px"
                    borderColor={borderColor}
                    bg={isSelected ? "bg.subtle" : "bg.panel"}
                    opacity={isDimmed ? 0.35 : 1}
                    shadow={isSelected || isConnected ? "sm" : "xs"}
                    transition="opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease"
                    onClick={() =>
                      onSelectFacet(
                        isSelected
                          ? null
                          : (facetLookup.get(facet.name) ?? facet),
                      )
                    }
                  >
                    <Card.Body>
                      <Stack gap="3">
                        <HStack justify="space-between" align="start" gap="3">
                          <Stack gap="1" align="start">
                            <Badge
                              colorPalette={facet.colorPalette}
                              variant="surface"
                            >
                              {facet.displayName}
                            </Badge>
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
                              Selected
                            </Badge>
                          ) : null}
                        </HStack>

                        {facetRelationships.length > 0 ? (
                          <>
                            <Separator />
                            <Stack gap="2">
                              {facetRelationships.map((relationship) => (
                                <HStack
                                  key={`${facet.name}-${relationship.direction}-${relationship.source}`}
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
        ))}
      </Stack>
    </Stack>
  );
};

export default DependencyView;
