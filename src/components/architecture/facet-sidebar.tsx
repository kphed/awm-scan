import {
  Accordion,
  Badge,
  Box,
  Heading,
  HStack,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react";
import type { ArchitectureFacet } from "@/lib/contracts";
import EventList from "./event-list";
import MethodList from "./method-list";
import SourceViewer from "./source-viewer";

interface FacetSidebarProps {
  facet: ArchitectureFacet;
}

const FacetSidebar = ({ facet }: FacetSidebarProps) => {
  return (
    <Stack gap="6">
      <Stack gap="4">
        <HStack justify="space-between" align="start" gap="4">
          <Stack gap="2">
            <Wrap gap="2">
              <Badge colorPalette={facet.colorPalette} variant="subtle">
                {facet.cluster.replace(/-/g, " ")}
              </Badge>
              {facet.isFallback ? (
                <Badge colorPalette="orange" variant="subtle">
                  Metadata Missing
                </Badge>
              ) : null}
            </Wrap>
            <Heading size="lg">{facet.displayName}</Heading>
            <Text
              color="fg.muted"
              fontFamily="var(--font-geist-mono)"
              fontSize="sm"
            >
              {facet.name}
            </Text>
          </Stack>
        </HStack>

        <Stack gap="3">
          <Box>
            <Text fontWeight="medium" mb="1">
              Business Summary
            </Text>
            <Text color="fg.muted">{facet.businessSummary}</Text>
          </Box>
          <Box>
            <Text fontWeight="medium" mb="1">
              Operational Impact
            </Text>
            <Text color="fg.muted">
              {facet.operationalImpact ||
                "No operational notes are available yet."}
            </Text>
          </Box>
          <Box>
            <Text fontWeight="medium" mb="2">
              Required Roles
            </Text>
            {facet.requiredRoles.length === 0 ? (
              <Text color="fg.muted">
                No dedicated role requirement listed.
              </Text>
            ) : (
              <Wrap gap="2">
                {facet.requiredRoles.map((role) => (
                  <Badge
                    key={role}
                    colorPalette={facet.colorPalette}
                    variant="surface"
                  >
                    {role}
                  </Badge>
                ))}
              </Wrap>
            )}
          </Box>
          {facet.eipReference ? (
            <Box>
              <Text fontWeight="medium" mb="2">
                Standards
              </Text>
              <Badge colorPalette="blue" variant="subtle">
                {facet.eipReference}
              </Badge>
            </Box>
          ) : null}
        </Stack>
      </Stack>

      <Accordion.Root collapsible multiple variant="plain">
        <Accordion.Item value="read-operations">
          <Accordion.ItemTrigger>
            <Box flex="1" textAlign="start" fontWeight="medium">
              Read Operations
            </Box>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <MethodList
                methods={facet.readMethods}
                emptyLabel="No read operations defined."
              />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>

        <Accordion.Item value="write-operations">
          <Accordion.ItemTrigger>
            <Box flex="1" textAlign="start" fontWeight="medium">
              Write Operations
            </Box>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <MethodList
                methods={facet.writeMethods}
                emptyLabel="No write operations defined."
              />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>

        <Accordion.Item value="events">
          <Accordion.ItemTrigger>
            <Box flex="1" textAlign="start" fontWeight="medium">
              Emitted Events
            </Box>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <EventList events={facet.events} />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>

        <Accordion.Item value="source-code">
          <Accordion.ItemTrigger>
            <Box flex="1" textAlign="start" fontWeight="medium">
              Source Code
            </Box>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <SourceViewer facetName={facet.name} />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>
    </Stack>
  );
};

export default FacetSidebar;
