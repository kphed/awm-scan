import { Badge, Card, HStack, Link, Stack, Text } from "@chakra-ui/react";
import type { DiamondProxyData } from "@/lib/contracts";

interface DiamondHeaderProps {
  diamondProxy: DiamondProxyData;
  totalFacets: number;
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const DiamondHeader = ({ diamondProxy, totalFacets }: DiamondHeaderProps) => {
  return (
    <Card.Root
      bg="bg.panel"
      borderColor="border.subtle"
      borderWidth="1px"
      shadow="sm"
    >
      <Card.Body gap="5">
        <Stack gap="3">
          <HStack justify="space-between" align="start" gap="4">
            <Stack gap="1">
              <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                The on-chain entry point for the fund
              </Text>
              <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="semibold">
                {diamondProxy.displayName}
              </Text>
              <Text
                fontSize="sm"
                color="fg.muted"
                fontFamily="var(--font-geist-mono)"
              >
                {diamondProxy.technicalName}
              </Text>
            </Stack>
            <Badge colorPalette="blue" variant="subtle">
              Hero Proxy
            </Badge>
          </HStack>

          <Text color="fg.muted">
            EIP-2535 Diamond Proxy · {totalFacets} modules · Ethereum Mainnet
          </Text>
        </Stack>

        <Stack gap="2">
          <Text
            fontSize="xs"
            textTransform="uppercase"
            color="fg.muted"
            letterSpacing="widest"
          >
            Contract Address
          </Text>
          <Link
            href={`https://etherscan.io/address/${diamondProxy.address}`}
            target="_blank"
            rel="noreferrer"
            color="fg"
            fontFamily="var(--font-geist-mono)"
            textDecoration="underline"
            textUnderlineOffset="0.2em"
          >
            {truncateAddress(diamondProxy.address)}
          </Link>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
};

export default DiamondHeader;
