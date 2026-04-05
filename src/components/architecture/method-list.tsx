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
import type { ParsedMethod } from "@/lib/contracts";

interface MethodListProps {
  methods: ParsedMethod[];
  emptyLabel: string;
}

const MethodList = ({ methods, emptyLabel }: MethodListProps) => {
  if (methods.length === 0) {
    return <Text color="fg.muted">{emptyLabel}</Text>;
  }

  return (
    <Stack gap="3">
      {methods.map((method, index) => (
        <Box
          key={method.signature}
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
                <Code fontSize="sm">{method.name}</Code>
                <Text color="fg.muted" fontSize="sm">
                  {method.signature}
                </Text>
              </Stack>
              <HStack gap="2" align="center">
                <Badge
                  colorPalette={
                    method.stateMutability === "view" ? "teal" : "orange"
                  }
                  variant="subtle"
                >
                  {method.stateMutability}
                </Badge>
                <Collapsible.Indicator
                  transition="transform 0.2s ease"
                  _open={{ transform: "rotate(180deg)" }}
                >
                  <LuChevronDown />
                </Collapsible.Indicator>
              </HStack>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Separator />
              <Stack px="4" py="4" gap="4">
                <Stack gap="2">
                  <Text fontSize="sm" fontWeight="medium">
                    Parameters
                  </Text>
                  {method.inputs.length === 0 ? (
                    <Text color="fg.muted" fontSize="sm">
                      No parameters
                    </Text>
                  ) : (
                    <Stack gap="2">
                      {method.inputs.map((input, inputIndex) => (
                        <Text
                          key={`${method.signature}-input-${inputIndex}`}
                          fontSize="sm"
                        >
                          <Code>{input.name || `arg${inputIndex}`}</Code> ·{" "}
                          {input.type}
                        </Text>
                      ))}
                    </Stack>
                  )}
                </Stack>

                <Stack gap="2">
                  <Text fontSize="sm" fontWeight="medium">
                    Returns
                  </Text>
                  {method.outputs.length === 0 ? (
                    <Text color="fg.muted" fontSize="sm">
                      No return values
                    </Text>
                  ) : (
                    <Stack gap="2">
                      {method.outputs.map((output, outputIndex) => (
                        <Text
                          key={`${method.signature}-output-${outputIndex}`}
                          fontSize="sm"
                        >
                          <Code>{output.name || `result${outputIndex}`}</Code> ·{" "}
                          {output.type}
                        </Text>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Collapsible.Content>
          </Collapsible.Root>
          {index < methods.length - 1 ? <Separator /> : null}
        </Box>
      ))}
    </Stack>
  );
};

export default MethodList;
