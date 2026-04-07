import type { ReactNode } from "react";
import { Badge, Code, HStack, Stack, Text } from "@chakra-ui/react";
import type { JsonSafeValue } from "@/lib/contracts";
import { truncateAddress } from "@/lib/format";

interface EventArgsViewerProps {
  args: Record<string, JsonSafeValue>;
}

const MAX_DEPTH = 5;

function renderValue(value: JsonSafeValue, depth = 0): ReactNode {
  if (depth >= MAX_DEPTH) {
    return (
      <Code fontSize="xs" wordBreak="break-all">
        {JSON.stringify(value)}
      </Code>
    );
  }

  if (value === null) {
    return <Code fontSize="xs">null</Code>;
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return <Code fontSize="xs">{String(value)}</Code>;
  }

  if (typeof value === "string") {
    const isAddress = value.startsWith("0x") && value.length === 42;
    const isHash = value.startsWith("0x") && value.length === 66;

    return (
      <Code fontSize="xs" title={value} wordBreak="break-all">
        {isAddress || isHash ? truncateAddress(value) : value}
      </Code>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <Code fontSize="xs">[]</Code>;
    }

    return (
      <Stack gap="1" pl={depth > 0 ? "4" : "0"}>
        {value.map((item, index) => (
          <HStack
            key={`${depth}-${index}`}
            gap="2"
            align="start"
            flexWrap="wrap"
          >
            <Badge colorPalette="gray" variant="subtle" fontSize="xs">
              {index}
            </Badge>
            {renderValue(item, depth + 1)}
          </HStack>
        ))}
      </Stack>
    );
  }

  return (
    <Stack gap="1" pl={depth > 0 ? "4" : "0"}>
      {Object.entries(value).map(([key, entry]) => (
        <HStack key={key} gap="2" align="start" flexWrap="wrap">
          <Badge colorPalette="gray" variant="subtle" fontSize="xs">
            {key}
          </Badge>
          {renderValue(entry, depth + 1)}
        </HStack>
      ))}
    </Stack>
  );
}

const EventArgsViewer = ({ args }: EventArgsViewerProps) => {
  const entries = Object.entries(args);

  if (entries.length === 0) {
    return (
      <Text color="fg.muted" fontSize="sm">
        No event parameters
      </Text>
    );
  }

  return (
    <Stack gap="2">
      {entries.map(([key, value]) => (
        <HStack key={key} gap="2" align="start" flexWrap="wrap">
          <Badge
            colorPalette="blue"
            variant="subtle"
            fontSize="xs"
            flexShrink={0}
          >
            {key}
          </Badge>
          {renderValue(value)}
        </HStack>
      ))}
    </Stack>
  );
};

export default EventArgsViewer;
