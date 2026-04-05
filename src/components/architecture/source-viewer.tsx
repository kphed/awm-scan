import { Box, Code, Stack, Text } from "@chakra-ui/react";
import { getFacetSourceCode } from "@/lib/contracts";

interface SourceViewerProps {
  facetName: string;
}

const SourceViewer = ({ facetName }: SourceViewerProps) => {
  const sourceCode = getFacetSourceCode(facetName);

  if (!sourceCode) {
    return (
      <Text color="fg.muted">
        Source code is unavailable for this module right now.
      </Text>
    );
  }

  return (
    <Stack gap="3">
      <Text color="fg.muted" fontSize="sm">
        Primary source file extracted from the verified Etherscan payload.
      </Text>
      <Box
        as="pre"
        maxH="24rem"
        overflow="auto"
        rounded="lg"
        borderWidth="1px"
        borderColor="border.subtle"
        bg="bg.panel"
        p="4"
        whiteSpace="pre"
        fontSize="xs"
        lineHeight="1.6"
      >
        <Code whiteSpace="pre" display="block" bg="transparent">
          {sourceCode}
        </Code>
      </Box>
    </Stack>
  );
};

export default SourceViewer;
