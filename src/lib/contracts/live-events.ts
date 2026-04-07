import type { Abi, Address, Hex, PublicClient } from "viem";
import { isAddress } from "viem";
import { FACT_TOKEN_DIAMOND_ADDRESS } from "./artifacts";
import type { IndexedEvent } from "./event-types";
import { getEventNameSignatureMap, getMergedEventAbi } from "./events";
import { eventId, serializeArgs } from "./indexed-events";

const DEFAULT_MONY_ADDRESS =
  "0x6a7c6aa2b8b8a6A891dE552bDEFFa87c3F53bD46" as const;
const MAX_CATCHUP_BLOCKS = 50_000n;
const CHUNK_SIZE = 10_000n;
const CHUNK_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [1000, 2000];
const STALE_THRESHOLD = 10_000n;
const BLOCK_TIMESTAMP_BATCH_SIZE = 5;

interface DecodedEventLogLike {
  args?: Record<string, unknown> | readonly unknown[] | null;
  blockNumber?: bigint | null;
  eventName?: string;
  logIndex?: number | null;
  transactionHash?: Hex | null;
}

export interface EventCatchupResponse {
  currentBlock: string | null;
  events: IndexedEvent[];
  isStale: boolean;
}

let cachedMonyAddress: Address | null = null;
let cachedEventSignatureLookup: Map<string, string> | null = null;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function resolveMonyAddress() {
  if (cachedMonyAddress) {
    return cachedMonyAddress;
  }

  const configuredAddress =
    process.env.NEXT_PUBLIC_MONY_SMART_CONTRACT_ADDRESS ??
    FACT_TOKEN_DIAMOND_ADDRESS;

  if (configuredAddress && isAddress(configuredAddress)) {
    cachedMonyAddress = configuredAddress;
    return cachedMonyAddress;
  }

  if (configuredAddress) {
    console.error("[liveEvents] Invalid MONY address, falling back", {
      configuredAddress,
    });
  }

  cachedMonyAddress = DEFAULT_MONY_ADDRESS;

  return cachedMonyAddress;
}

export function getSafeEventSignatureLookup(context: string) {
  if (cachedEventSignatureLookup) {
    return cachedEventSignatureLookup;
  }

  try {
    cachedEventSignatureLookup = getEventNameSignatureMap();
    return cachedEventSignatureLookup;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    throw new Error(`[${context}] ${message}`);
  }
}

async function fetchChunkWithRetry(
  client: PublicClient,
  abi: Abi,
  fromBlock: bigint,
  toBlock: bigint,
  context: string,
): Promise<DecodedEventLogLike[]> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return (await withTimeout(
        client.getContractEvents({
          address: resolveMonyAddress(),
          abi,
          fromBlock,
          toBlock,
        }),
        CHUNK_TIMEOUT_MS,
      )) as DecodedEventLogLike[];
    } catch (err) {
      console.error(`[${context}] Catch-up chunk failed`, {
        attempt,
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString(),
        err,
      });

      if (attempt === MAX_RETRIES) {
        throw err;
      }

      await delay(RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS.at(-1) ?? 0);
    }
  }

  return [];
}

export async function fetchBlockTimestamps(
  client: PublicClient,
  logs: DecodedEventLogLike[],
  logContext: string,
) {
  const timestamps = new Map<string, string>();
  const blockNumbers = [
    ...new Set(
      logs
        .map((log) => log.blockNumber?.toString())
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  for (
    let start = 0;
    start < blockNumbers.length;
    start += BLOCK_TIMESTAMP_BATCH_SIZE
  ) {
    const batch = blockNumbers.slice(start, start + BLOCK_TIMESTAMP_BATCH_SIZE);
    const resolvedBatch = await Promise.all(
      batch.map(async (blockNumber) => {
        try {
          const block = await client.getBlock({
            blockNumber: BigInt(blockNumber),
          });

          return [blockNumber, block.timestamp.toString()] as const;
        } catch (err) {
          console.error(`[${logContext}] Failed to fetch block timestamp`, {
            blockNumber,
            err,
          });

          return [blockNumber, "0"] as const;
        }
      }),
    );

    for (const [blockNumber, timestamp] of resolvedBatch) {
      timestamps.set(blockNumber, timestamp);
    }
  }

  return timestamps;
}

function serializeDecodedEvent(
  log: DecodedEventLogLike,
  blockTimestamp: string,
  signatureLookup: Map<string, string>,
) {
  if (!log.eventName) {
    throw new Error("Decoded event is missing an eventName");
  }

  if (log.blockNumber === null || log.blockNumber === undefined) {
    throw new Error(`Decoded event ${log.eventName} is missing a blockNumber`);
  }

  if (!log.transactionHash) {
    throw new Error(
      `Decoded event ${log.eventName} is missing a transactionHash`,
    );
  }

  if (log.logIndex === null || log.logIndex === undefined) {
    throw new Error(`Decoded event ${log.eventName} is missing a logIndex`);
  }

  const signature = signatureLookup.get(log.eventName);

  if (!signature) {
    throw new Error(`Unknown event signature for ${log.eventName}`);
  }

  return {
    eventName: log.eventName,
    signature,
    blockNumber: log.blockNumber.toString(),
    blockTimestamp,
    transactionHash: log.transactionHash,
    logIndex: log.logIndex,
    id: eventId(log.transactionHash, log.logIndex),
    args: serializeArgs(log.args),
  } satisfies IndexedEvent;
}

export async function fetchLiveEventDelta(
  snapshotBlock: bigint,
  client: PublicClient,
): Promise<EventCatchupResponse> {
  const currentBlock = await client.getBlockNumber();
  const delta = currentBlock - snapshotBlock;

  if (delta <= 0n) {
    return {
      currentBlock: currentBlock.toString(),
      events: [],
      isStale: false,
    };
  }

  const isStale = delta > STALE_THRESHOLD;

  if (delta > MAX_CATCHUP_BLOCKS) {
    return {
      currentBlock: currentBlock.toString(),
      events: [],
      isStale,
    };
  }

  const mergedEventAbi = getMergedEventAbi() as Abi;
  const signatureLookup = getSafeEventSignatureLookup("liveEvents");
  const deltaEvents: IndexedEvent[] = [];

  for (
    let fromBlock = snapshotBlock + 1n;
    fromBlock <= currentBlock;
    fromBlock += CHUNK_SIZE
  ) {
    const toBlock =
      fromBlock + CHUNK_SIZE - 1n > currentBlock
        ? currentBlock
        : fromBlock + CHUNK_SIZE - 1n;
    const logs = await fetchChunkWithRetry(
      client,
      mergedEventAbi,
      fromBlock,
      toBlock,
      "liveEvents",
    );
    const timestamps = await fetchBlockTimestamps(client, logs, "liveEvents");

    for (const log of logs) {
      deltaEvents.push(
        serializeDecodedEvent(
          log,
          timestamps.get(log.blockNumber?.toString() ?? "") ?? "0",
          signatureLookup,
        ),
      );
    }
  }

  return {
    currentBlock: currentBlock.toString(),
    events: deltaEvents,
    isStale,
  };
}
