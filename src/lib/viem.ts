import { createPublicClient, fallback, http } from "viem";
import { mainnet } from "viem/chains";

export function createMonyClient() {
  const primaryRpcUrl = process.env.NEXT_PUBLIC_PRIMARY_RPC_URL;
  const secondaryRpcUrl = process.env.NEXT_PUBLIC_SECONDARY_RPC_URL;

  if (!primaryRpcUrl) {
    throw new Error("NEXT_PUBLIC_PRIMARY_RPC_URL is required");
  }

  const primaryTransport = http(primaryRpcUrl);

  return createPublicClient({
    chain: mainnet,
    transport: secondaryRpcUrl
      ? fallback([primaryTransport, http(secondaryRpcUrl)])
      : primaryTransport,
  });
}
