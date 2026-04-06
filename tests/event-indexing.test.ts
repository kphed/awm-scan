import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, test } from "bun:test";
import { decodeEventLog } from "viem";
import firstEventBlock from "./artifacts/api/rpc/eth_getBlockByNumber-first-event-block.json";
import firstEventChunk from "./artifacts/api/rpc/eth_getLogs-first-events-chunk.json";

type EventModule = typeof import("../src/lib/contracts/events");
type IndexModule = typeof import("../scripts/indexEvents");
type CopyModule = typeof import("../scripts/copyEventSnapshot");

async function loadEventModule(): Promise<EventModule | null> {
  return import("../src/lib/contracts/events").catch(() => null);
}

async function loadIndexModule(): Promise<IndexModule | null> {
  return import("../scripts/indexEvents").catch(() => null);
}

async function loadCopyModule(): Promise<CopyModule | null> {
  return import("../scripts/copyEventSnapshot").catch(() => null);
}

describe("event indexing", () => {
  test("builds a deduplicated merged event ABI with canonical tuple signatures", async () => {
    const eventModule = await loadEventModule();

    expect(eventModule).not.toBeNull();

    if (!eventModule) {
      return;
    }

    const mergedAbi = eventModule.getMergedEventAbi();
    const eventFacetMap = eventModule.getEventFacetMap();
    const diamondCut = mergedAbi.find((entry) => entry.name === "DiamondCut");

    expect(mergedAbi).toHaveLength(40);
    expect(diamondCut).toBeDefined();
    expect(eventModule.getEventSignature(diamondCut!)).toBe(
      "DiamondCut((address,uint8,bytes4[])[],address,bytes)",
    );
    expect(eventFacetMap.get("Transfer(address,address,uint256)")).toEqual([
      "BurnPreparableFacet",
      "BurnRespondableFacet",
      "BurnableFacet",
      "ERC20FacetTransferBurnableStoppable",
      "ManagedAccountFacet",
      "MintableFacet",
    ]);
    expect(
      eventFacetMap.get("DiamondCut((address,uint8,bytes4[])[],address,bytes)"),
    ).toEqual(["DiamondCutFacet"]);
  });

  test("serializes a real DiamondCut log into a JSON-safe indexed event", async () => {
    const eventModule = await loadEventModule();
    const indexModule = await loadIndexModule();

    expect(eventModule).not.toBeNull();
    expect(indexModule).not.toBeNull();

    if (!eventModule || !indexModule) {
      return;
    }

    const rawLog = firstEventChunk.result[0];
    const decoded = decodeEventLog({
      abi: eventModule.getMergedEventAbi() as never,
      data: rawLog.data as `0x${string}`,
      topics: rawLog.topics as [`0x${string}`, ...`0x${string}`[]],
    });
    const indexed = indexModule.serializeDecodedEvent(
      {
        eventName: decoded.eventName,
        args: decoded.args as unknown as Record<string, unknown>,
        blockNumber: BigInt(rawLog.blockNumber),
        transactionHash: rawLog.transactionHash as `0x${string}`,
        logIndex: Number.parseInt(rawLog.logIndex, 16),
      },
      BigInt(firstEventBlock.result.timestamp).toString(),
    );
    const diamondCutArgs = indexed.args._diamondCut;

    expect(indexed).toMatchObject({
      eventName: "DiamondCut",
      signature: "DiamondCut((address,uint8,bytes4[])[],address,bytes)",
      blockNumber: BigInt(rawLog.blockNumber).toString(),
      blockTimestamp: BigInt(firstEventBlock.result.timestamp).toString(),
      transactionHash: rawLog.transactionHash,
      logIndex: Number.parseInt(rawLog.logIndex, 16),
      id: `${rawLog.transactionHash}:${Number.parseInt(rawLog.logIndex, 16)}`,
    });
    expect(Array.isArray(diamondCutArgs)).toBe(true);

    if (!Array.isArray(diamondCutArgs)) {
      return;
    }

    expect(diamondCutArgs[0]).toMatchObject({
      facetAddress: "0x2C4a8a4F2e8A617E54BCBCf80fCcCF46C98519cE",
      action: 0,
      functionSelectors: ["0x1f931c1c"],
    });
    expect(indexed.args._init).toBe("0xC6B9e851a599e0Da88b39f0E8Bc2B0683A503e81");
    expect(typeof indexed.args._calldata).toBe("string");
  });

  test("deduplicates overlapping event reruns by id and keeps block order", async () => {
    const indexModule = await loadIndexModule();

    expect(indexModule).not.toBeNull();

    if (!indexModule) {
      return;
    }

    const existing = [
      {
        eventName: "Transfer",
        signature: "Transfer(address,address,uint256)",
        blockNumber: "10",
        blockTimestamp: "100",
        transactionHash: "0xaaa",
        logIndex: 2,
        id: "0xaaa:2",
        args: {
          from: "0x0",
          to: "0x1",
          value: "1",
        },
      },
    ];
    const rerun = [
      {
        ...existing[0],
      },
      {
        ...existing[0],
        blockNumber: "11",
        blockTimestamp: "101",
        transactionHash: "0xbbb",
        logIndex: 1,
        id: "0xbbb:1",
      },
    ];

    expect(indexModule.mergeIndexedEvents(existing, rerun)).toEqual([
      existing[0],
      rerun[1],
    ]);
  });

  test("copies the generated snapshot and fails loudly when the source is missing", async () => {
    const copyModule = await loadCopyModule();

    expect(copyModule).not.toBeNull();

    if (!copyModule) {
      return;
    }

    const tempRoot = mkdtempSync(join(tmpdir(), "awm-scan-events-"));
    const sourceDir = join(tempRoot, "src", "contracts", "events");
    const targetDir = join(tempRoot, "public", "events");

    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(
      join(sourceDir, "snapshot.json"),
      JSON.stringify({ cursor: { lastIndexedBlock: "1", indexedAt: "now", totalEvents: 0 }, events: [] }),
    );

    copyModule.copyEventSnapshot({
      sourcePath: join(sourceDir, "snapshot.json"),
      targetPath: join(targetDir, "snapshot.json"),
    });

    expect(
      JSON.parse(readFileSync(join(targetDir, "snapshot.json"), "utf8")),
    ).toEqual({
      cursor: {
        lastIndexedBlock: "1",
        indexedAt: "now",
        totalEvents: 0,
      },
      events: [],
    });

    expect(() =>
      copyModule.copyEventSnapshot({
        sourcePath: join(tempRoot, "missing", "snapshot.json"),
        targetPath: join(targetDir, "snapshot.json"),
      }),
    ).toThrow(/Missing snapshot source file/);

    rmSync(tempRoot, { recursive: true, force: true });
  });
});
