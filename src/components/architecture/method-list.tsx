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
import { getMethodDescription, type ParsedMethod } from "@/lib/contracts";
import { Tooltip } from "@/components/ui/tooltip";

interface MethodListProps {
  methods: ParsedMethod[];
  emptyLabel: string;
}

const MUTABILITY_TOOLTIPS: Record<ParsedMethod["stateMutability"], string> = {
  view: "Reads blockchain state but does not modify it. No gas cost when called externally.",
  pure: "Does not read or modify blockchain state. A computation-only function.",
  nonpayable:
    "Writes to blockchain state. Requires a signed transaction and gas.",
  payable:
    "Writes to blockchain state and can accept ETH with the transaction.",
};

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
              <Stack gap="1" align="start" flex="1" minW="0">
                <Code fontSize="sm">{method.name}</Code>
                <Text color="fg.muted" fontSize="sm" truncate>
                  {method.signature}
                </Text>
              </Stack>
              <HStack gap="2" align="center">
                <Tooltip
                  content={MUTABILITY_TOOLTIPS[method.stateMutability]}
                  openDelay={200}
                  showArrow
                >
                  <Badge
                    colorPalette={
                      method.stateMutability === "view" ||
                      method.stateMutability === "pure"
                        ? "teal"
                        : "orange"
                    }
                    variant="subtle"
                    cursor="help"
                  >
                    {method.stateMutability}
                  </Badge>
                </Tooltip>
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
                <Box>
                  <Text fontSize="sm" fontWeight="medium">
                    Description
                  </Text>
                  <Text color="fg.muted" fontSize="sm">
                    {getMethodDescription(method.signature) ??
                      "No description available."}
                  </Text>
                </Box>

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
                        <HStack
                          key={`${method.signature}-input-${inputIndex}`}
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
                        </HStack>
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
                        <HStack
                          key={`${method.signature}-output-${outputIndex}`}
                          gap="2"
                          align="center"
                          flexWrap="wrap"
                        >
                          <Code fontSize="sm">
                            {output.name || `result${outputIndex}`}
                          </Code>
                          <Badge
                            colorPalette="gray"
                            variant="subtle"
                            fontSize="xs"
                          >
                            {output.type}
                          </Badge>
                        </HStack>
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
