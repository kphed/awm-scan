import { Badge, HStack, Text } from "@chakra-ui/react";
import {
  formatLineRange,
  type LineRange,
  type SourceFileRecord,
} from "@/lib/contracts";

interface StatusBarProps {
  file: SourceFileRecord;
  lineRange?: LineRange | null;
}

const StatusBar = ({ file, lineRange }: StatusBarProps) => {
  return (
    <HStack
      justify="space-between"
      align="center"
      gap="3"
      wrap="wrap"
      px="4"
      py="3"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
    >
      <Text fontFamily="var(--font-geist-mono)" fontSize="sm">
        {file.path}
      </Text>
      <HStack gap="2" wrap="wrap">
        <Badge variant="subtle">{formatLineRange(lineRange)}</Badge>
        <Badge variant="subtle">Solidity {file.solcVersion}</Badge>
        <Badge variant="outline">Profile {file.compilerProfile}</Badge>
      </HStack>
    </HStack>
  );
};

export default StatusBar;
