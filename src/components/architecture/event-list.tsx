import {
  Badge,
  Box,
  Code,
  Collapsible,
  HStack,
  Link,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { LuChevronDown } from "react-icons/lu";
import { getEventDescription, type ParsedEvent } from "@/lib/contracts";

interface EventListProps {
  events: ParsedEvent[];
  occurrenceCounts?: Record<string, number>;
}

const EventList = ({ events, occurrenceCounts }: EventListProps) => {
  if (events.length === 0) {
    return <Text color="fg.muted">No emitted events defined.</Text>;
  }

  return (
    <Stack gap="3">
      {occurrenceCounts ? (
        <Text color="fg.muted" fontSize="xs">
          Occurrence counts come from the indexed snapshot. The Explorer may
          show newer live catch-up data when RPC access is available.
        </Text>
      ) : null}
      {events.map((event) => {
        const occurrenceCount = occurrenceCounts?.[event.signature] ?? 0;

        return (
          <Box
            key={event.signature}
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="lg"
            bg="bg.panel"
          >
            <Collapsible.Root unmountOnExit>
              <Collapsible.Trigger
                width="full"
                px="4"
                py="3"
                display="flex"
                justifyContent="space-between"
                alignItems="start"
                gap="3"
              >
                <Stack gap="1" align="start" flex="1" minW="0">
                  <HStack gap="2" flexWrap="wrap">
                    <Code fontSize="sm">{event.name}</Code>
                    {occurrenceCount > 0 ? (
                      <Badge
                        colorPalette="blue"
                        variant="subtle"
                        fontSize="xs"
                        title="Based on the checked-in indexed event snapshot"
                      >
                        {occurrenceCount} on-chain
                      </Badge>
                    ) : null}
                  </HStack>
                  <Text color="fg.muted" fontSize="sm" truncate>
                    {event.signature}
                  </Text>
                </Stack>
                <Collapsible.Indicator
                  transition="transform 0.2s ease"
                  _open={{ transform: "rotate(180deg)" }}
                >
                  <LuChevronDown />
                </Collapsible.Indicator>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Separator />
                <Stack px="4" py="4" gap="4">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium">
                      Description
                    </Text>
                    <Text color="fg.muted" fontSize="sm">
                      {getEventDescription(event.signature) ??
                        "No description available."}
                    </Text>
                  </Box>

                  {event.inputs.length === 0 ? (
                    <Text color="fg.muted" fontSize="sm">
                      No event parameters
                    </Text>
                  ) : (
                    event.inputs.map((input, inputIndex) => (
                      <HStack
                        key={`${event.signature}-param-${inputIndex}`}
                        gap="2"
                        align="center"
                        flexWrap="wrap"
                      >
                        <Code fontSize="sm">
                          {input.name || `arg${inputIndex}`}
                        </Code>
                        <Badge
                          colorPalette="gray"
                          variant="subtle"
                          fontSize="xs"
                        >
                          {input.type}
                        </Badge>
                        {input.indexed ? (
                          <Badge colorPalette="purple" variant="subtle">
                            indexed
                          </Badge>
                        ) : null}
                      </HStack>
                    ))
                  )}

                  {occurrenceCount > 0 ? (
                    <Link
                      as={NextLink}
                      href={`/?event=${encodeURIComponent(event.name)}&signature=${encodeURIComponent(event.signature)}`}
                      fontSize="sm"
                      color="fg.muted"
                      title="Filters the Explorer to this event signature"
                      _hover={{ color: "fg" }}
                    >
                      View {occurrenceCount} on-chain occurrence
                      {occurrenceCount === 1 ? "" : "s"} →
                    </Link>
                  ) : null}
                </Stack>
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>
        );
      })}
    </Stack>
  );
};

export default EventList;
