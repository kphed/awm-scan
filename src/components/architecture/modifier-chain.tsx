import { Badge, Code, HStack, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import type { MethodSourceInfo, ParsedMethod } from "@/lib/contracts";
import { buildSourceExplorerHref } from "@/lib/contracts";

interface ModifierChainProps {
  methods: ParsedMethod[];
  methodSource: Record<string, MethodSourceInfo>;
}

const MODIFIER_COLORS: Record<
  MethodSourceInfo["modifiers"][number]["type"],
  string
> = {
  account: "cyan",
  other: "gray",
  pause: "orange",
  role: "green",
  token: "blue",
};

const ModifierChain = ({ methods, methodSource }: ModifierChainProps) => {
  const sourcedMethods = methods.filter(
    (method) => (methodSource[method.signature]?.modifiers.length ?? 0) > 0,
  );

  if (sourcedMethods.length === 0) {
    return (
      <Text color="fg.muted" fontSize="sm">
        No modifier-based guard rails were extracted for this module.
      </Text>
    );
  }

  return (
    <Stack gap="4">
      {sourcedMethods.map((method) => {
        const sourceInfo = methodSource[method.signature];

        if (!sourceInfo) {
          return null;
        }

        return (
          <Stack
            key={method.signature}
            gap="3"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="lg"
            bg="bg.panel"
            p="4"
          >
            <Stack gap="1">
              <Code fontSize="sm" width="fit-content">
                {method.name}()
              </Code>
              <Text color="fg.muted" fontSize="sm">
                {method.signature}
              </Text>
            </Stack>

            <Stack
              gap="3"
              pl="4"
              borderLeftWidth="2px"
              borderColor="border.subtle"
            >
              {sourceInfo.modifiers.map((modifier) => (
                <Stack
                  key={`${method.signature}-${modifier.name}-${modifier.line}`}
                  gap="1.5"
                >
                  <HStack gap="2" align="center" wrap="wrap">
                    <Badge
                      colorPalette={MODIFIER_COLORS[modifier.type]}
                      variant="subtle"
                    >
                      {modifier.type}
                    </Badge>
                    <Code fontSize="sm">{modifier.name}</Code>
                    <Link
                      as={NextLink}
                      href={buildSourceExplorerHref(modifier.filePath, {
                        start: modifier.line,
                        end: modifier.line,
                      })}
                      fontSize="sm"
                      textDecoration="underline"
                      textUnderlineOffset="0.2em"
                    >
                      {modifier.filePath}:L{modifier.line}
                    </Link>
                  </HStack>
                  {modifier.resolvedCall ? (
                    <Text
                      color="fg.muted"
                      fontFamily="var(--font-geist-mono)"
                      fontSize="xs"
                    >
                      {modifier.resolvedCall}
                    </Text>
                  ) : null}
                </Stack>
              ))}
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
};

export default ModifierChain;
