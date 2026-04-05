import { sleep } from "bun";

import {
  createPublicClient,
  http,
  getContract,
  Address,
  isAddress,
} from "viem";
import { mainnet } from "viem/chains";

if (
  !process.env.NEXT_PUBLIC_PRIMARY_RPC_URL ||
  !process.env.ETHERSCAN_API_KEY ||
  !isAddress(process.env.NEXT_PUBLIC_MONY_SMART_CONTRACT_ADDRESS || "")
) {
  throw new Error("Missing or invalid env vars");
}

type ContractSourceCodeResults = {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  CompilerType: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  ContractFileName: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
  SimilarMatch: string;
}[];

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_PRIMARY_RPC_URL),
});
const monyContract = getContract({
  address: "0x6a7c6aa2b8b8a6A891dE552bDEFFa87c3F53bD46",
  abi: [
    {
      type: "function",
      name: "facetAddresses",
      inputs: [],
      outputs: [
        {
          name: "facetAddresses_",
          type: "address[]",
          internalType: "address[]",
        },
      ],
      stateMutability: "view",
    },
  ],
  client: { public: publicClient },
});

const getContractSource = async (address: Address) => {
  try {
    if (!isAddress(address)) {
      throw new Error("Invalid address");
    }

    const response = await fetch(
      `https://api.etherscan.io/v2/api?apikey=${process.env.ETHERSCAN_API_KEY}&chainid=1&module=contract&action=getsourcecode&address=${address}`,
    );

    if (!response.ok) {
      throw new Error("Response failed");
    }

    const { result } = (await response.json()) as {
      result: ContractSourceCodeResults;
    };

    await Promise.all(
      result.map(async (_result) => {
        const { ContractName, ABI } = _result;

        // Write contract source code with address to `src/contracts/source`.
        await Bun.write(
          `${__dirname}/../src/contracts/source/${ContractName}.json`,
          JSON.stringify({ ...result, address }),
        );

        // Write contract source code to `src/contracts/abi`.
        await Bun.write(
          `${__dirname}/../src/contracts/abi/${ContractName}.json`,
          ABI,
        );
      }),
    );

    // Prevent rate-limiting
    await sleep(2_000);
  } catch (err) {
    console.error("getContractAbi error", { address, err });
  }
};

const faucetAddresses = async () => {
  try {
    return monyContract.read.facetAddresses();
  } catch (err) {
    console.error("faucetAddresses error", err);
  }
};

(async () => {
  // Get and store the Diamond proxy contract before doing the same for the facets.
  await getContractSource(
    process.env.NEXT_PUBLIC_MONY_SMART_CONTRACT_ADDRESS as Address,
  );

  const addresses = await faucetAddresses();
  const results: {
    status: "OK" | "ERROR";
    error: null | {
      address: Address;
      err: unknown;
    };
  }[] = [];

  if (!addresses?.length) {
    throw new Error("No faucet addresses");
  }

  // Loop over all returned addresses to get and write contract ABIs to disk.
  for (let i = 0; i < addresses?.length; i += 1) {
    try {
      await getContractSource(addresses[i]);
      results[i] = {
        status: "OK",
        error: null,
      };
    } catch (err) {
      console.error("Error", {
        i,
        address: addresses[i],
        err,
      });
      results[i] = {
        status: "OK",
        error: {
          address: addresses[i],
          err,
        },
      };
    }
  }
})();
