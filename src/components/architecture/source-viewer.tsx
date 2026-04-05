import { Box, Code, Collapsible, Stack, Text } from "@chakra-ui/react";
import { LuChevronDown } from "react-icons/lu";
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
    <Collapsible.Root unmountOnExit>
      <Collapsible.Trigger
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        width="full"
        px="1"
        py="2"
        fontWeight="medium"
      >
        <Text>View Solidity source</Text>
        <Collapsible.Indicator
          transition="transform 0.2s ease"
          _open={{ transform: "rotate(180deg)" }}
        >
          <LuChevronDown />
        </Collapsible.Indicator>
      </Collapsible.Trigger>
      <Collapsible.Content>
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
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

export default SourceViewer;
