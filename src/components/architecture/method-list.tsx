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
import {
  buildSourceExplorerHref,
  getMethodDescription,
  type MethodSourceInfo,
  type ParsedMethod,
  type SourceFileRecord,
} from "@/lib/contracts";
import { Tooltip } from "@/components/ui/tooltip";
import CodeViewer from "@/components/source-explorer/code-viewer";

interface MethodListProps {
  methods: ParsedMethod[];
  emptyLabel: string;
  sourceBySignature?: Record<string, MethodSourceInfo>;
  sourceFilesByPath?: Record<string, SourceFileRecord>;
}

const MUTABILITY_TOOLTIPS: Record<ParsedMethod["stateMutability"], string> = {
  view: "Reads blockchain state but does not modify it. No gas cost when called externally.",
  pure: "Does not read or modify blockchain state. A computation-only function.",
  nonpayable:
    "Writes to blockchain state. Requires a signed transaction and gas.",
  payable:
    "Writes to blockchain state and can accept ETH with the transaction.",
};

const MethodList = ({
  methods,
  emptyLabel,
  sourceBySignature,
  sourceFilesByPath,
}: MethodListProps) => {
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
              {(() => {
                const sourceInfo = sourceBySignature?.[method.signature];
                const sourceFile = sourceInfo
                  ? sourceFilesByPath?.[sourceInfo.filePath]
                  : undefined;
                const fallbackDescription = getMethodDescription(
                  method.signature,
                );
                const natspecNotice = sourceInfo?.natspec?.notice;
                const natspecParams = sourceInfo?.natspec?.params ?? {};
                const natspecReturns = sourceInfo?.natspec?.returns ?? {};
                const natspecDev = sourceInfo?.natspec?.dev ?? [];

                return (
                  <Stack px="4" py="4" gap="4">
                    <Box>
                      <Text fontSize="sm" fontWeight="medium">
                        Description
                      </Text>
                      <Text color="fg.muted" fontSize="sm">
                        {fallbackDescription ?? "No description available."}
                      </Text>
                    </Box>

                    {natspecNotice && natspecNotice !== fallbackDescription ? (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          @notice
                        </Text>
                        <Text color="fg.muted" fontSize="sm">
                          {natspecNotice}
                        </Text>
                      </Box>
                    ) : null}

                    {natspecDev.length > 0 ? (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          Developer Notes
                        </Text>
                        <Stack gap="1" mt="1">
                          {natspecDev.map((note) => (
                            <Text
                              key={`${method.signature}-${note}`}
                              color="fg.muted"
                              fontSize="sm"
                            >
                              {note}
                            </Text>
                          ))}
                        </Stack>
                      </Box>
                    ) : null}

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
                          {method.inputs.map((input, inputIndex) => {
                            const inputName = input.name || `arg${inputIndex}`;

                            return (
                              <Stack
                                key={`${method.signature}-input-${inputIndex}`}
                                gap="1"
                              >
                                <HStack gap="2" align="center" flexWrap="wrap">
                                  <Code fontSize="sm">{inputName}</Code>
                                  <Badge
                                    colorPalette="gray"
                                    variant="subtle"
                                    fontSize="xs"
                                  >
                                    {input.type}
                                  </Badge>
                                </HStack>
                                {natspecParams[inputName] ? (
                                  <Text color="fg.muted" fontSize="sm">
                                    {natspecParams[inputName]}
                                  </Text>
                                ) : null}
                              </Stack>
                            );
                          })}
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
                          {method.outputs.map((output, outputIndex) => {
                            const outputName =
                              output.name || `result${outputIndex}`;

                            return (
                              <Stack
                                key={`${method.signature}-output-${outputIndex}`}
                                gap="1"
                              >
                                <HStack gap="2" align="center" flexWrap="wrap">
                                  <Code fontSize="sm">{outputName}</Code>
                                  <Badge
                                    colorPalette="gray"
                                    variant="subtle"
                                    fontSize="xs"
                                  >
                                    {output.type}
                                  </Badge>
                                </HStack>
                                {natspecReturns[outputName] ? (
                                  <Text color="fg.muted" fontSize="sm">
                                    {natspecReturns[outputName]}
                                  </Text>
                                ) : null}
                              </Stack>
                            );
                          })}
                        </Stack>
                      )}
                    </Stack>

                    {sourceInfo && sourceFile ? (
                      <Stack gap="3">
                        <HStack
                          justify="space-between"
                          align="center"
                          gap="3"
                          wrap="wrap"
                        >
                          <Text fontSize="sm" fontWeight="medium">
                            Source Code
                          </Text>
                          <Link
                            as={NextLink}
                            href={buildSourceExplorerHref(sourceInfo.filePath, {
                              start: sourceInfo.startLine,
                              end: sourceInfo.endLine,
                            })}
                            fontSize="sm"
                            textDecoration="underline"
                            textUnderlineOffset="0.2em"
                          >
                            Open in Source Explorer
                          </Link>
                        </HStack>
                        <Collapsible.Root unmountOnExit>
                          <Collapsible.Trigger
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            width="full"
                            borderWidth="1px"
                            borderColor="border.subtle"
                            borderRadius="lg"
                            px="3"
                            py="2"
                          >
                            <Text fontSize="sm">View Source</Text>
                            <Collapsible.Indicator
                              transition="transform 0.2s ease"
                              _open={{ transform: "rotate(180deg)" }}
                            >
                              <LuChevronDown />
                            </Collapsible.Indicator>
                          </Collapsible.Trigger>
                          <Collapsible.Content>
                            <Box pt="3">
                              <CodeViewer
                                file={sourceFile}
                                highlightRange={{
                                  start: sourceInfo.startLine,
                                  end: sourceInfo.endLine,
                                }}
                                maxH="20rem"
                              />
                            </Box>
                          </Collapsible.Content>
                        </Collapsible.Root>
                      </Stack>
                    ) : null}
                  </Stack>
                );
              })()}
            </Collapsible.Content>
          </Collapsible.Root>
          {index < methods.length - 1 ? <Separator /> : null}
        </Box>
      ))}
    </Stack>
  );
};

export default MethodList;
