import { Box, HStack, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import {
  buildSourceExplorerHref,
  type LineRange,
  type SourceFileRecord,
} from "@/lib/contracts";

interface CodeViewerProps {
  file: SourceFileRecord;
  highlightRange?: LineRange | null;
  maxH?: string;
  showHeaderLink?: boolean;
}

function isHighlightedLine(lineNumber: number, range?: LineRange | null) {
  if (!range) {
    return false;
  }

  return lineNumber >= range.start && lineNumber <= range.end;
}

const CodeViewer = ({
  file,
  highlightRange,
  maxH,
  showHeaderLink = false,
}: CodeViewerProps) => {
  return (
    <Stack gap="3">
      {showHeaderLink ? (
        <HStack justify="space-between" align="center" gap="3" wrap="wrap">
          <Text color="fg.muted" fontSize="sm">
            {file.path}
          </Text>
          <Link
            as={NextLink}
            href={buildSourceExplorerHref(file.path, highlightRange)}
            fontSize="sm"
            textDecoration="underline"
            textUnderlineOffset="0.2em"
          >
            Open in Source Explorer
          </Link>
        </HStack>
      ) : null}
      <Box
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="xl"
        bg="bg.panel"
        overflow="auto"
        maxH={maxH}
      >
        <Box
          fontFamily="var(--font-geist-mono)"
          fontSize="xs"
          lineHeight="1.7"
          minW="max-content"
          py="3"
        >
          {file.tokenLines.map((tokens, index) => {
            const lineNumber = index + 1;
            const isHighlighted = isHighlightedLine(lineNumber, highlightRange);

            return (
              <HStack
                key={`${file.path}-line-${lineNumber}`}
                id={`line-${lineNumber}`}
                align="stretch"
                gap="0"
                bg={isHighlighted ? "blue.subtle" : "transparent"}
                borderLeftWidth="3px"
                borderLeftColor={isHighlighted ? "blue.400" : "transparent"}
              >
                <Text
                  color="fg.subtle"
                  minW="3.75rem"
                  px="3"
                  py="0.5"
                  textAlign="right"
                  userSelect="none"
                >
                  {lineNumber}
                </Text>
                <Box
                  flex="1"
                  px="4"
                  py="0.5"
                  whiteSpace="pre"
                  overflow="hidden"
                >
                  {tokens.length === 0 ? " " : null}
                  {tokens.map((token, tokenIndex) => (
                    <Box
                      key={`${file.path}-line-${lineNumber}-token-${tokenIndex}`}
                      as="span"
                      color={token.color}
                      fontStyle={token.fontStyle === 1 ? "italic" : "normal"}
                    >
                      {token.content}
                    </Box>
                  ))}
                </Box>
              </HStack>
            );
          })}
        </Box>
      </Box>
    </Stack>
  );
};

export default CodeViewer;
