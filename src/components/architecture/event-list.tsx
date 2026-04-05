import {
  Badge,
  Box,
  Code,
  Collapsible,
  HStack,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LuChevronDown } from "react-icons/lu";
import type { ParsedEvent } from "@/lib/contracts";

interface EventListProps {
  events: ParsedEvent[];
}

const EventList = ({ events }: EventListProps) => {
  if (events.length === 0) {
    return <Text color="fg.muted">No emitted events defined.</Text>;
  }

  return (
    <Stack gap="3">
      {events.map((event, index) => (
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
              <Stack gap="1" align="start" flex="1">
                <Code fontSize="sm">{event.name}</Code>
                <Text color="fg.muted" fontSize="sm">
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
              <Stack px="4" py="4" gap="2">
                {event.inputs.length === 0 ? (
                  <Text color="fg.muted" fontSize="sm">
                    No event parameters
                  </Text>
                ) : (
                  event.inputs.map((input, inputIndex) => (
                    <HStack
                      key={`${event.signature}-param-${inputIndex}`}
                      justify="space-between"
                      align="start"
                    >
                      <Text fontSize="sm">
                        <Code>{input.name || `arg${inputIndex}`}</Code> ·{" "}
                        {input.type}
                      </Text>
                      {input.indexed ? (
                        <Badge colorPalette="purple" variant="subtle">
                          indexed
                        </Badge>
                      ) : null}
                    </HStack>
                  ))
                )}
              </Stack>
            </Collapsible.Content>
          </Collapsible.Root>
          {index < events.length - 1 ? <Separator /> : null}
        </Box>
      ))}
    </Stack>
  );
};

export default EventList;
