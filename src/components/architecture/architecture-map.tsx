"use client";

import {
  Box,
  Card,
  Center,
  Drawer,
  Flex,
  Link,
  Portal,
  Stack,
  Tabs,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import type { ArchitectureData, ArchitectureFacet } from "@/lib/contracts";
import ClusterGroup from "./cluster-group";
import DependencyView from "./dependency-view";
import DiamondHeader from "./diamond-header";
import FacetSidebar from "./facet-sidebar";
import LifecycleFlows from "./lifecycle-flows";
import PermissionMatrix from "./permission-matrix";

interface ArchitectureMapProps {
  data: ArchitectureData;
}

const ArchitectureMap = ({ data }: ArchitectureMapProps) => {
  const [activeTab, setActiveTab] = useState("map");
  const [selectedFacet, setSelectedFacet] = useState<ArchitectureFacet | null>(
    null,
  );
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;
  const showDesktopSidebar = !isMobile && activeTab === "map";
  const showOverlayDetails = Boolean(selectedFacet) && !showDesktopSidebar;
  const handleFacetSelect = useCallback((facet: ArchitectureFacet | null) => {
    setSelectedFacet(facet);
  }, []);

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
            <Box>
              <Text color="fg.muted" fontSize="sm" lineHeight="tall">
                The MONY Fund Token uses the{" "}
                <Link
                  href="https://eips.ethereum.org/EIPS/eip-2535"
                  target="_blank"
                  rel="noreferrer"
                  textDecoration="underline"
                  textUnderlineOffset="0.2em"
                >
                  EIP-2535 Diamond
                </Link>{" "}
                proxy pattern, which splits the contract&apos;s functionality
                across multiple modules (called &quot;facets&quot;). This design
                lets each facet be developed, audited, and upgraded
                independently, without running into Solidity&apos;s 24 KB
                contract size limit. Each group below represents a business
                function of the protocol, and each row is a facet that handles a
                specific capability.
              </Text>
            </Box>
            <Tabs.Root
              defaultValue="map"
              lazyMount
              value={activeTab}
              unmountOnExit
              variant="line"
              onValueChange={(details) => {
                setActiveTab(details.value);
                setSelectedFacet(null);
              }}
            >
              <Tabs.List overflowX="auto" overflowY="hidden">
                <Tabs.Trigger value="map">Module Map</Tabs.Trigger>
                <Tabs.Trigger value="permissions">
                  Permission Matrix
                </Tabs.Trigger>
                <Tabs.Trigger value="dependencies">Dependencies</Tabs.Trigger>
                <Tabs.Trigger value="flows">Lifecycle Flows</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="map" pt="6">
                <Stack gap="8">
                  {data.clusters.map((cluster) => (
                    <ClusterGroup
                      key={cluster.id}
                      cluster={cluster}
                      selectedFacet={selectedFacet}
                      onSelect={setSelectedFacet}
                    />
                  ))}
                </Stack>
              </Tabs.Content>

              <Tabs.Content value="permissions" pt="6">
                <PermissionMatrix
                  data={data}
                  onSelectFacet={handleFacetSelect}
                />
              </Tabs.Content>

              <Tabs.Content value="dependencies" pt="6">
                <DependencyView data={data} onSelectFacet={handleFacetSelect} />
              </Tabs.Content>

              <Tabs.Content value="flows" pt="6">
                <LifecycleFlows data={data} onSelectFacet={handleFacetSelect} />
              </Tabs.Content>
            </Tabs.Root>
          </Stack>
        </Box>

        <Box
          display={showDesktopSidebar ? "block" : "none"}
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
            <Card.Body maxH="calc(100vh - 3rem)" overflowY="auto">
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
        placement={isMobile ? "bottom" : "end"}
        open={showOverlayDetails}
        onOpenChange={(details) => {
          if (!details.open) {
            setSelectedFacet(null);
          }
        }}
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content
              roundedTop={isMobile ? "2xl" : undefined}
              maxH={isMobile ? "85vh" : "100vh"}
            >
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
