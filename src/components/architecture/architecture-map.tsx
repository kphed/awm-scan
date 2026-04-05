"use client";

import {
  Box,
  Card,
  Center,
  Drawer,
  Flex,
  Portal,
  Stack,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useState } from "react";
import type { ArchitectureData, ArchitectureFacet } from "@/lib/contracts";
import ClusterGroup from "./cluster-group";
import DiamondHeader from "./diamond-header";
import FacetSidebar from "./facet-sidebar";

interface ArchitectureMapProps {
  data: ArchitectureData;
}

const ArchitectureMap = ({ data }: ArchitectureMapProps) => {
  const [selectedFacet, setSelectedFacet] = useState<ArchitectureFacet | null>(
    null,
  );
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;

  return (
    <>
      <Flex
        direction={{ base: "column", md: "row" }}
        gap={{ base: "6", md: "8" }}
        align="start"
      >
        <Box flex="3" width="full">
          <Stack gap="8">
            <DiamondHeader
              diamondProxy={data.diamondProxy}
              totalFacets={data.stats.totalFacets}
            />
            {data.clusters.map((cluster) => (
              <ClusterGroup
                key={cluster.id}
                cluster={cluster}
                selectedFacet={selectedFacet}
                onSelect={setSelectedFacet}
              />
            ))}
          </Stack>
        </Box>

        <Box
          display={{ base: "none", md: "block" }}
          flex="1"
          minW={{ md: "22rem", lg: "24rem" }}
          position="sticky"
          top="6"
          alignSelf="start"
        >
          <Card.Root
            borderWidth="1px"
            borderColor="border.subtle"
            bg="bg.canvas"
            shadow="sm"
          >
            <Card.Body>
              {selectedFacet ? (
                <FacetSidebar facet={selectedFacet} />
              ) : (
                <Center minH="24rem" textAlign="center">
                  <Stack gap="2">
                    <Text fontWeight="medium">
                      Select a module to explore its capabilities
                    </Text>
                    <Text color="fg.muted">
                      Business context appears first, and the technical detail
                      stays tucked behind deliberate disclosure.
                    </Text>
                  </Stack>
                </Center>
              )}
            </Card.Body>
          </Card.Root>
        </Box>
      </Flex>

      <Drawer.Root
        placement="bottom"
        open={isMobile ? Boolean(selectedFacet) : false}
        onOpenChange={(details) => {
          if (!details.open) {
            setSelectedFacet(null);
          }
        }}
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content roundedTop="2xl" maxH="85vh">
              <Drawer.Header>
                <Drawer.Title>
                  {selectedFacet ? selectedFacet.displayName : "Module details"}
                </Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                {selectedFacet ? <FacetSidebar facet={selectedFacet} /> : null}
              </Drawer.Body>
              <Drawer.CloseTrigger />
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
};

export default ArchitectureMap;
