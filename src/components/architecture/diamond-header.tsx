import { Badge, Card, HStack, Link, Stack, Text } from "@chakra-ui/react";
import type { DiamondProxyData } from "@/lib/contracts";
import { eipToUrl, truncateAddress } from "@/lib/format";

interface DiamondHeaderProps {
  diamondProxy: DiamondProxyData;
  totalFacets: number;
}

const DiamondHeader = ({ diamondProxy, totalFacets }: DiamondHeaderProps) => {
  const eip2535Url = eipToUrl("EIP-2535");

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
              Diamond Proxy
            </Badge>
          </HStack>

          <Text color="fg.muted">
            {eip2535Url ? (
              <Link
                href={eip2535Url}
                target="_blank"
                rel="noreferrer"
                textDecoration="underline"
                textUnderlineOffset="0.2em"
              >
                EIP-2535
              </Link>
            ) : (
              "EIP-2535"
            )}{" "}
            Diamond Proxy · {totalFacets} facets/modules · Ethereum Mainnet
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
