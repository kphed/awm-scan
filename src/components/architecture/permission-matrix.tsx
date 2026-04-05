import { Badge, Box, Code, Stack, Table, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import {
  ROLE_DESCRIPTIONS,
  derivePermissionMatrix,
  type ArchitectureData,
  type ArchitectureFacet,
} from "@/lib/contracts";
import { Tooltip } from "@/components/ui/tooltip";

interface PermissionMatrixProps {
  data: ArchitectureData;
  onSelectFacet: (facet: ArchitectureFacet | null) => void;
}

const PermissionMatrix = ({ data, onSelectFacet }: PermissionMatrixProps) => {
  const matrixData = useMemo(() => derivePermissionMatrix(data), [data]);
  const facetLookup = useMemo(() => {
    const map = new Map<string, ArchitectureFacet>();

    for (const cluster of data.clusters) {
      for (const facet of cluster.facets) {
        map.set(facet.name, facet);
      }
    }

    return map;
  }, [data]);
  const clusterSections = useMemo(
    () =>
      data.clusters.map((cluster) => {
        const facets = matrixData.facets.filter(
          (facet) => facet.cluster === cluster.id,
        );
        const roles = matrixData.roles.filter((role) =>
          facets.some((facet) => matrixData.matrix.get(role)?.has(facet.name)),
        );

        return {
          ...cluster,
          facets,
          roles,
        };
      }),
    [data, matrixData],
  );

  return (
    <Stack gap="4">
      <Text color="fg.muted" fontSize="sm" lineHeight="tall">
        Registry-authored caller-role view for write-capable modules. Some
        modules also rely on parameter-level checks or dynamic role-admin
        lookups, which are called out in the shared module details. Hover a
        permission marker to inspect the write methods covered by that role, and
        click it to open the shared module details.
      </Text>

      <Stack gap="6">
        {clusterSections.map((cluster) => (
          <Stack key={cluster.id} gap="3">
            <Stack gap="1">
              <Text fontWeight="semibold">{cluster.label}</Text>
              <Text color="fg.muted" fontSize="sm">
                {cluster.subtitle}
              </Text>
            </Stack>

            <Table.ScrollArea
              borderWidth="1px"
              borderColor="border.subtle"
              rounded="xl"
            >
              <Table.Root interactive size="sm" stickyHeader variant="outline">
                <Table.Header>
                  <Table.Row bg="bg.subtle">
                    <Table.ColumnHeader
                      minW="14rem"
                      position="sticky"
                      left="0"
                      zIndex="2"
                      bg="bg.canvas"
                    >
                      Role
                    </Table.ColumnHeader>
                    {cluster.facets.map((facet) => (
                      <Table.ColumnHeader
                        key={facet.name}
                        minW="12rem"
                        textAlign="center"
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          whiteSpace="normal"
                        >
                          {facet.displayName}
                        </Text>
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {cluster.roles.map((role) => (
                    <Table.Row key={`${cluster.id}-${role}`}>
                      <Table.Cell
                        position="sticky"
                        left="0"
                        zIndex="1"
                        bg="bg.canvas"
                        fontWeight="medium"
                      >
                        <Tooltip
                          content={
                            ROLE_DESCRIPTIONS[role] ??
                            "Role description unavailable."
                          }
                          contentProps={{ maxW: "xs" }}
                          openDelay={200}
                          showArrow
                        >
                          <Badge variant="surface">{role}</Badge>
                        </Tooltip>
                      </Table.Cell>

                      {cluster.facets.map((facet) => {
                        const writeMethods =
                          matrixData.writeMethodsByFacet.get(facet.name) ?? [];
                        const hasPermission =
                          matrixData.matrix.get(role)?.has(facet.name) ?? false;
                        const fullFacet = facetLookup.get(facet.name);

                        return (
                          <Table.Cell
                            key={`${cluster.id}-${role}-${facet.name}`}
                            textAlign="center"
                          >
                            <Box
                              width="full"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {hasPermission && fullFacet ? (
                                <Tooltip
                                  content={
                                    <Stack gap="2">
                                      <Text fontWeight="medium">
                                        {facet.displayName}
                                      </Text>
                                      {writeMethods.map((method) => (
                                        <Code
                                          key={`${facet.name}-${method}`}
                                          fontSize="xs"
                                        >
                                          {method}()
                                        </Code>
                                      ))}
                                    </Stack>
                                  }
                                  contentProps={{ maxW: "xs" }}
                                  openDelay={150}
                                  showArrow
                                >
                                  <Box
                                    as="button"
                                    display="inline-flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    aria-label={`Open ${facet.displayName} details for ${role}`}
                                    onClick={() => onSelectFacet(fullFacet)}
                                  >
                                    <Badge
                                      colorPalette={facet.colorPalette}
                                      variant="solid"
                                      borderRadius="full"
                                      minW="5"
                                      h="5"
                                      display="inline-flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      fontSize="sm"
                                      lineHeight="1"
                                    >
                                      •
                                    </Badge>
                                  </Box>
                                </Tooltip>
                              ) : (
                                <Text color="fg.subtle">-</Text>
                              )}
                            </Box>
                          </Table.Cell>
                        );
                      })}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Table.ScrollArea>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

export default PermissionMatrix;
