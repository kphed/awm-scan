import {
  Badge,
  Box,
  Code,
  HStack,
  Stack,
  Tabs,
  Text,
  Timeline,
  Wrap,
} from "@chakra-ui/react";
import { useMemo } from "react";
import {
  LIFECYCLE_FLOWS,
  type ArchitectureData,
  type ArchitectureFacet,
} from "@/lib/contracts";

interface LifecycleFlowsProps {
  data: ArchitectureData;
  onSelectFacet: (facet: ArchitectureFacet | null) => void;
}

const LifecycleFlows = ({ data, onSelectFacet }: LifecycleFlowsProps) => {
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
        Read-only playbooks for the protocol actions operators run most often.
        Each step keeps the business narrative in plain language while linking
        back to the module responsible for it.
      </Text>

      <Tabs.Root defaultValue={LIFECYCLE_FLOWS[0]?.id} variant="enclosed">
        <Tabs.List overflowX="auto" overflowY="hidden">
          {LIFECYCLE_FLOWS.map((flow) => (
            <Tabs.Trigger key={flow.id} value={flow.id}>
              {flow.name}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {LIFECYCLE_FLOWS.map((flow) => (
          <Tabs.Content key={flow.id} value={flow.id} pt="6">
            <Stack gap="4">
              <Stack gap="2">
                <Text color="fg.muted">{flow.description}</Text>
                {flow.relatedFlows?.length ? (
                  <Wrap gap="2">
                    {flow.relatedFlows.map((relatedFlow) => {
                      const relatedDefinition = LIFECYCLE_FLOWS.find(
                        (candidate) => candidate.id === relatedFlow,
                      );

                      if (!relatedDefinition) {
                        return null;
                      }

                      return (
                        <Badge key={relatedFlow} variant="subtle">
                          Related: {relatedDefinition.name}
                        </Badge>
                      );
                    })}
                  </Wrap>
                ) : null}
              </Stack>

              <Timeline.Root size="md" variant="outline">
                {flow.steps.map((step, index) => {
                  const facet = facetLookup.get(step.facetName);

                  return (
                    <Timeline.Item key={`${flow.id}-${index}`}>
                      <Timeline.Connector>
                        <Timeline.Separator />
                        <Timeline.Indicator>{index + 1}</Timeline.Indicator>
                      </Timeline.Connector>
                      <Timeline.Content pb="8">
                        <Timeline.Title>
                          <HStack gap="2" flexWrap="wrap">
                            <Text>{step.label}</Text>
                            <Badge
                              colorPalette={step.isOnChain ? "blue" : "gray"}
                              variant="subtle"
                            >
                              {step.isOnChain ? "On-chain" : "Off-chain"}
                            </Badge>
                            <Badge variant="outline">{step.actor}</Badge>
                          </HStack>
                        </Timeline.Title>
                        <Timeline.Description>
                          <Stack gap="2" pt="1">
                            <Text color="fg">{step.description}</Text>
                            <HStack gap="2" flexWrap="wrap">
                              <Box
                                as={facet ? "button" : "div"}
                                onClick={() => onSelectFacet(facet ?? null)}
                              >
                                <Badge
                                  colorPalette={facet?.colorPalette ?? "gray"}
                                  variant="surface"
                                  cursor={facet ? "pointer" : "default"}
                                >
                                  {facet?.displayName ?? step.facetName}
                                </Badge>
                              </Box>
                              <Text
                                color="fg.muted"
                                fontFamily="var(--font-geist-mono)"
                                fontSize="xs"
                              >
                                {step.facetName}
                              </Text>
                              {step.methodName ? (
                                <Code fontSize="xs">{step.methodName}()</Code>
                              ) : null}
                            </HStack>
                          </Stack>
                        </Timeline.Description>
                      </Timeline.Content>
                    </Timeline.Item>
                  );
                })}
              </Timeline.Root>
            </Stack>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Stack>
  );
};

export default LifecycleFlows;
