import {
  Badge,
  Code,
  Heading,
  HStack,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react";
import { LuActivity, LuClock, LuHash } from "react-icons/lu";

interface ExplorerHeaderProps {
  currentBlock: string | null;
  filteredEvents: number;
  isCatchingUp: boolean;
  isStale: boolean;
  snapshotBlock: string;
  totalEvents: number;
}

function getStatusState(
  currentBlock: string | null,
  isCatchingUp: boolean,
  isStale: boolean,
) {
  if (isCatchingUp) {
    return { colorPalette: "yellow", label: "Catching up…" };
  }

  if (!currentBlock) {
    return { colorPalette: "gray", label: "Snapshot only" };
  }

  if (isStale) {
    return { colorPalette: "orange", label: "Snapshot may be stale" };
  }

  return { colorPalette: "green", label: "Live" };
}

const ExplorerHeader = ({
  currentBlock,
  filteredEvents,
  isCatchingUp,
  isStale,
  snapshotBlock,
  totalEvents,
}: ExplorerHeaderProps) => {
  const status = getStatusState(currentBlock, isCatchingUp, isStale);
  const totalLabel =
    filteredEvents === totalEvents
      ? `${totalEvents} events`
      : `${filteredEvents} of ${totalEvents} events`;

  return (
    <Stack gap="4">
      <Stack gap="1">
        <Heading size="2xl">Protocol Activity</Heading>
        <Text color="fg.muted" fontSize="sm">
          On-chain events emitted by the MONY Diamond proxy, enriched with
          Architecture modules and Source Explorer cross-links.
        </Text>
      </Stack>

      <Wrap gap="4">
        <HStack gap="1.5">
          <LuHash />
          <Text fontSize="sm" fontWeight="medium">
            {totalLabel}
          </Text>
        </HStack>

        <HStack gap="1.5">
          <LuClock />
          <Text fontSize="sm" color="fg.muted">
            Through block <Code fontSize="xs">{snapshotBlock}</Code>
            {currentBlock ? (
              <>
                {" "}
                · Head <Code fontSize="xs">{currentBlock}</Code>
              </>
            ) : null}
          </Text>
        </HStack>

        <HStack gap="1.5">
          <LuActivity />
          <Badge
            colorPalette={status.colorPalette}
            variant="subtle"
            fontSize="xs"
          >
            {status.label}
          </Badge>
        </HStack>
      </Wrap>
    </Stack>
  );
};

export default ExplorerHeader;
