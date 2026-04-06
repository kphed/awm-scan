import { sleep } from "bun";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Abi, Address, Hex, PublicClient } from "viem";
import { isAddress } from "viem";
import { FACT_TOKEN_DIAMOND_ADDRESS } from "../src/lib/contracts/artifacts";
import type {
  EventSnapshot,
  IndexedEvent,
  IndexerCursor,
  JsonSafeValue,
} from "../src/lib/contracts/event-types";
import { getEventSignature, getMergedEventAbi } from "../src/lib/contracts/events";
import type { RawAbiEntry } from "../src/lib/contracts/types";
import { createMonyClient } from "../src/lib/viem";

const DEPLOYMENT_BLOCK = 23890166n;
const CHUNK_SIZE = 10_000n;
const CHUNK_DELAY_MS = 200;
const MAX_RETRIES = 3;
const EVENTS_DIR = path.resolve(import.meta.dir, "../src/contracts/events");
const SNAPSHOT_PATH = path.join(EVENTS_DIR, "snapshot.json");
const CURSOR_PATH = path.join(EVENTS_DIR, "cursor.json");

interface DecodedEventLogLike {
  eventName?: string;
  args?: Record<string, unknown> | readonly unknown[] | null;
  blockNumber?: bigint | null;
  transactionHash?: Hex | null;
  logIndex?: number | null;
}

type StoredIndexedEvent = Omit<IndexedEvent, "id"> & { id?: string };

function buildEventSignatureLookup(abi: RawAbiEntry[]) {
  const lookup = new Map<string, string>();

  for (const entry of abi) {
    if (entry.type !== "event" || !entry.name) {
      continue;
    }

    const signature = getEventSignature(entry);
    const existing = lookup.get(entry.name);

    // Event-name overloads would make the Phase 1 snapshot ambiguous.
    if (existing && existing !== signature) {
      throw new Error(`Event name overload detected for ${entry.name}`);
    }

    lookup.set(entry.name, signature);
  }

  return lookup;
}

const MERGED_EVENT_ABI = getMergedEventAbi();
const EVENT_SIGNATURE_LOOKUP = buildEventSignatureLookup(MERGED_EVENT_ABI);

function getMonyAddress(): Address {
  const configuredAddress =
    process.env.NEXT_PUBLIC_MONY_SMART_CONTRACT_ADDRESS ??
    FACT_TOKEN_DIAMOND_ADDRESS;

  if (!isAddress(configuredAddress)) {
    throw new Error("Missing or invalid MONY smart contract address");
  }

  return configuredAddress;
}

export function eventId(transactionHash: string, logIndex: number) {
  return `${transactionHash}:${logIndex}`;
}

export function toJsonSafe(value: unknown): JsonSafeValue {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonSafe(entry));
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const result: Record<string, JsonSafeValue> = {};

    for (const [key, entry] of Object.entries(objectValue)) {
      result[key] = toJsonSafe(entry);
    }

    return result;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return String(value);
}

export function serializeArgs(
  args: Record<string, unknown> | readonly unknown[] | null | undefined,
): Record<string, JsonSafeValue> {
  if (!args) {
    return {};
  }

  const normalizedArgs = Array.isArray(args)
    ? Object.fromEntries(args.map((value, index) => [String(index), value]))
    : args;
  const serializedArgs: Record<string, JsonSafeValue> = {};

  for (const [key, value] of Object.entries(normalizedArgs)) {
    serializedArgs[key] = toJsonSafe(value);
  }

  return serializedArgs;
}

export function serializeDecodedEvent(
  log: DecodedEventLogLike,
  blockTimestamp: string,
): IndexedEvent {
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

  const signature = EVENT_SIGNATURE_LOOKUP.get(log.eventName);

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
  };
}

export function mergeIndexedEvents(
  existingEvents: IndexedEvent[],
  nextEvents: IndexedEvent[],
) {
  const merged = new Map<string, IndexedEvent>();

  for (const event of [...existingEvents, ...nextEvents]) {
    if (!merged.has(event.id)) {
      merged.set(event.id, event);
    }
  }

  return [...merged.values()].sort((left, right) => {
    const blockDiff = BigInt(left.blockNumber) - BigInt(right.blockNumber);

    if (blockDiff !== 0n) {
      return blockDiff < 0n ? -1 : 1;
    }

    return left.logIndex - right.logIndex;
  });
}

function normalizeStoredIndexedEvent(event: StoredIndexedEvent): IndexedEvent {
  return {
    ...event,
    id: event.id ?? eventId(event.transactionHash, event.logIndex),
  };
}

async function readCursor(): Promise<IndexerCursor | null> {
  try {
    const file = Bun.file(CURSOR_PATH);

    if (!(await file.exists())) {
      return null;
    }

    return (await file.json()) as IndexerCursor;
  } catch (err) {
    console.error("[readCursor] Failed to read cursor", { err });
    return null;
  }
}

async function readExistingEvents(): Promise<IndexedEvent[]> {
  try {
    const file = Bun.file(SNAPSHOT_PATH);

    if (!(await file.exists())) {
      return [];
    }

    const snapshot = (await file.json()) as {
      events?: StoredIndexedEvent[];
    };

    if (!Array.isArray(snapshot.events)) {
      throw new Error("Snapshot is missing an events array");
    }

    return snapshot.events.map((event) => normalizeStoredIndexedEvent(event));
  } catch (err) {
    console.error("[readExistingEvents] Failed to read snapshot", { err });
    return [];
  }
}

async function fetchChunkWithRetry(
  client: PublicClient,
  abi: Abi,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<DecodedEventLogLike[]> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const logs = await client.getContractEvents({
        address: getMonyAddress(),
        abi,
        fromBlock,
        toBlock,
      });

      await sleep(CHUNK_DELAY_MS);

      return logs as unknown as DecodedEventLogLike[];
    } catch (err) {
      console.error("[fetchChunkWithRetry] Chunk failed", {
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString(),
        attempt,
        err,
      });

      if (attempt === MAX_RETRIES) {
        throw err;
      }

      await sleep(1000 * 2 ** (attempt - 1));
    }
  }

  throw new Error("Failed to fetch event chunk");
}

async function fetchBlockTimestamps(
  client: PublicClient,
  logs: DecodedEventLogLike[],
) {
  const blockNumbers = [...new Set(logs.map((log) => log.blockNumber?.toString()))]
    .filter((blockNumber): blockNumber is string => Boolean(blockNumber));
  const timestamps = new Map<string, string>();

  for (const blockNumber of blockNumbers) {
    const block = await client.getBlock({
      blockNumber: BigInt(blockNumber),
    });

    timestamps.set(blockNumber, block.timestamp.toString());
    await sleep(100);
  }

  return timestamps;
}

async function writeSnapshot(events: IndexedEvent[], lastIndexedBlock: bigint) {
  if (!existsSync(EVENTS_DIR)) {
    mkdirSync(EVENTS_DIR, { recursive: true });
  }

  const cursor: IndexerCursor = {
    lastIndexedBlock: lastIndexedBlock.toString(),
    indexedAt: new Date().toISOString(),
    totalEvents: events.length,
  };
  const snapshot: EventSnapshot = {
    cursor,
    events,
  };

  await Bun.write(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
  await Bun.write(CURSOR_PATH, JSON.stringify(cursor, null, 2));

  console.info("[writeSnapshot] Wrote event snapshot", {
    events: events.length,
    lastIndexedBlock: cursor.lastIndexedBlock,
  });
}

export async function indexEvents(client = createMonyClient()) {
  const currentBlock = await client.getBlockNumber();
  const cursor = await readCursor();
  const startBlock = cursor
    ? BigInt(cursor.lastIndexedBlock) + 1n
    : DEPLOYMENT_BLOCK;

  if (startBlock > currentBlock) {
    console.info("[indexEvents] Event snapshot already up to date", {
      lastIndexedBlock: cursor?.lastIndexedBlock ?? DEPLOYMENT_BLOCK.toString(),
    });
    return;
  }

  const existingEvents = await readExistingEvents();
  const nextEvents: IndexedEvent[] = [];
  const totalChunks = Math.ceil(Number(currentBlock - startBlock + 1n) / Number(CHUNK_SIZE));
  const mergedAbi = MERGED_EVENT_ABI as unknown as Abi;
  let chunkNumber = 0;

  for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += CHUNK_SIZE) {
    const toBlock =
      fromBlock + CHUNK_SIZE - 1n > currentBlock
        ? currentBlock
        : fromBlock + CHUNK_SIZE - 1n;

    chunkNumber += 1;

    const logs = await fetchChunkWithRetry(client, mergedAbi, fromBlock, toBlock);
    const blockTimestamps = await fetchBlockTimestamps(client, logs);

    for (const log of logs) {
      const timestamp = blockTimestamps.get(log.blockNumber?.toString() ?? "");

      if (!timestamp) {
        throw new Error(
          `Missing block timestamp for ${log.blockNumber?.toString() ?? "unknown block"}`,
        );
      }

      nextEvents.push(serializeDecodedEvent(log, timestamp));
    }

    console.info("[indexEvents] Indexed chunk", {
      chunk: `${chunkNumber}/${totalChunks}`,
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      logs: logs.length,
    });
  }

  const mergedEvents = mergeIndexedEvents(existingEvents, nextEvents);

  await writeSnapshot(mergedEvents, currentBlock);
}

if (import.meta.main) {
  await indexEvents();
}
