import { describe, expect, test } from "bun:test";
import snapshot from "../src/contracts/events/snapshot.json";
import { getArchitectureData } from "../src/lib/contracts";
import { getEventNameSignatureMap } from "../src/lib/contracts/events";
import {
  findUncategorizedEventNames,
  buildEventAttributionIndex,
  countEventOccurrences,
} from "../src/lib/contracts/event-attribution";

describe("buildEventAttributionIndex", () => {
  test("joins merged event signatures to module, cluster, and source metadata", () => {
    const index = buildEventAttributionIndex(getArchitectureData());
    const attribution =
      index["DiamondCut((address,uint8,bytes4[])[],address,bytes)"];

    expect(attribution).toBeDefined();
    expect(attribution?.category).toBe("Diamond Proxy");
    expect(attribution?.colorPalette).toBe("gray");
    expect(attribution?.facetNames).toContain("DiamondCutFacet");
    expect(attribution?.displayNames).toContain("Module Upgrades");
    expect(attribution?.sourceFiles.length).toBeGreaterThan(0);
  });

  test("deduplicates source links across multi-facet event signatures", () => {
    const index = buildEventAttributionIndex(getArchitectureData());
    const attribution = index["Transfer(address,address,uint256)"];

    expect(attribution).toBeDefined();
    expect(attribution?.displayNames).toContain("Token Transfers");
    expect(attribution?.displayNames).toContain("Subscription Processing");
    expect(
      new Set(attribution?.sourceFiles.map((file) => file.path)).size,
    ).toBe(attribution?.sourceFiles.length);
  });
});

describe("countEventOccurrences", () => {
  test("builds a signature keyed occurrence map from the checked-in snapshot", () => {
    const counts = countEventOccurrences(snapshot.events);
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    expect(total).toBe(snapshot.events.length);
    expect(counts["Transfer(address,address,uint256)"]).toBeGreaterThan(0);
    expect(
      counts["DiamondCut((address,uint8,bytes4[])[],address,bytes)"],
    ).toBeGreaterThan(0);
  });
});

describe("findUncategorizedEventNames", () => {
  test("keeps the checked-in ABI event set fully categorized", () => {
    expect(
      findUncategorizedEventNames([...getEventNameSignatureMap().keys()]),
    ).toEqual([]);
  });

  test("reports missing categories for uncategorized event names", () => {
    expect(findUncategorizedEventNames(["Transfer", "SyntheticEvent"])).toEqual(
      ["SyntheticEvent"],
    );
  });
});
