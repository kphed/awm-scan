import { sleep } from "bun";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { Abi, Address, Hex, PublicClient } from "viem";
import type {
  EventSnapshot,
  IndexedEvent,
  IndexerCursor,
} from "../src/lib/contracts/event-types";
import { assertEventCategoriesCovered } from "../src/lib/contracts/event-attribution";
import {
  eventId,
  mergeIndexedEvents,
  serializeArgs,
  toJsonSafe,
} from "../src/lib/contracts/indexed-events";
import { getMergedEventAbi } from "../src/lib/contracts/events";
import {
  fetchBlockTimestamps,
  getSafeEventSignatureLookup,
  resolveMonyAddress,
} from "../src/lib/contracts/live-events";
import { createMonyClient } from "../src/lib/viem";

export { eventId, mergeIndexedEvents, serializeArgs, toJsonSafe };

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

const MERGED_EVENT_ABI = getMergedEventAbi();

let cachedIndexerEventSignatureLookup: Map<string, string> | null = null;

function getIndexerEventSignatureLookup() {
  if (cachedIndexerEventSignatureLookup) {
    return cachedIndexerEventSignatureLookup;
  }

  cachedIndexerEventSignatureLookup =
    getSafeEventSignatureLookup("indexEvents");

  return cachedIndexerEventSignatureLookup;
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

  const signature = getIndexerEventSignatureLookup().get(log.eventName);

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
        address: resolveMonyAddress() as Address,
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
  const signatureLookup = getIndexerEventSignatureLookup();

  assertEventCategoriesCovered([...signatureLookup.keys()]);

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
  const totalChunks = Math.ceil(
    Number(currentBlock - startBlock + 1n) / Number(CHUNK_SIZE),
  );
  const mergedAbi = MERGED_EVENT_ABI as unknown as Abi;
  let chunkNumber = 0;

  for (
    let fromBlock = startBlock;
    fromBlock <= currentBlock;
    fromBlock += CHUNK_SIZE
  ) {
    const toBlock =
      fromBlock + CHUNK_SIZE - 1n > currentBlock
        ? currentBlock
        : fromBlock + CHUNK_SIZE - 1n;

    chunkNumber += 1;

    const logs = await fetchChunkWithRetry(
      client,
      mergedAbi,
      fromBlock,
      toBlock,
    );
    const blockTimestamps = await fetchBlockTimestamps(
      client,
      logs,
      "indexEvents",
    );

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
