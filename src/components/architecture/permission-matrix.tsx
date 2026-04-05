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

  return (
    <Stack gap="4">
      <Text color="fg.muted" fontSize="sm" lineHeight="tall">
        Registry-authored responsibility view for write-capable modules. Hover a
        permission marker to inspect the write methods covered by that role, and
        click it to open the shared module details.
      </Text>

      <Table.ScrollArea
        borderWidth="1px"
        borderColor="border.subtle"
        rounded="xl"
      >
        <Table.Root interactive size="sm" stickyHeader variant="outline">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              <Table.ColumnHeader
                rowSpan={2}
                minW="14rem"
                position="sticky"
                left="0"
                zIndex="2"
                bg="bg.canvas"
                verticalAlign="middle"
              >
                Role
              </Table.ColumnHeader>
              {data.clusters.map((cluster) => (
                <Table.ColumnHeader
                  key={cluster.id}
                  colSpan={cluster.facets.length}
                  textAlign="center"
                >
                  {cluster.label}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
            <Table.Row bg="bg.subtle">
              {matrixData.facets.map((facet) => (
                <Table.ColumnHeader key={facet.name} minW="12rem">
                  <Text fontSize="xs" fontWeight="semibold" whiteSpace="normal">
                    {facet.displayName}
                  </Text>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {matrixData.roles.map((role) => (
              <Table.Row key={role}>
                <Table.Cell
                  position="sticky"
                  left="0"
                  zIndex="1"
                  bg="bg.canvas"
                  fontWeight="medium"
                >
                  <Tooltip
                    content={
                      ROLE_DESCRIPTIONS[role] ?? "Role description unavailable."
                    }
                    contentProps={{ maxW: "xs" }}
                    openDelay={200}
                    showArrow
                  >
                    <Badge variant="surface">{role}</Badge>
                  </Tooltip>
                </Table.Cell>

                {matrixData.facets.map((facet) => {
                  const writeMethods =
                    matrixData.writeMethodsByFacet.get(facet.name) ?? [];
                  const hasPermission =
                    matrixData.matrix.get(role)?.has(facet.name) ?? false;
                  const fullFacet = facetLookup.get(facet.name);

                  return (
                    <Table.Cell
                      key={`${role}-${facet.name}`}
                      textAlign="center"
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
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Stack>
  );
};

export default PermissionMatrix;
