import { describe, expect, test } from "bun:test";
import burnableSource from "../src/contracts/source/BurnableFacet.json";
import {
  assembleArchitectureData,
  extractPrimarySourceCode,
  getAllFacets,
} from "../src/lib/contracts";
import {
  BUSINESS_CLUSTERS,
  FACET_REGISTRY,
} from "../src/lib/contracts/registry";

describe("contracts data layer", () => {
  test("parses representative ABI fixtures into read, write, and event buckets", () => {
    const facets = getAllFacets();
    const mintableFacet = facets.find(
      (facet) => facet.name === "MintableFacet",
    );
    const managedAccountFacet = facets.find(
      (facet) => facet.name === "ManagedAccountFacet",
    );
    const erc20Facet = facets.find(
      (facet) => facet.name === "ERC20FacetTransferBurnableStoppable",
    );

    expect(mintableFacet).toMatchObject({
      readMethods: [],
      writeMethods: [expect.objectContaining({ name: "mint" })],
    });
    expect(managedAccountFacet?.readMethods).toHaveLength(4);
    expect(managedAccountFacet?.writeMethods).toHaveLength(12);
    expect(managedAccountFacet?.events).toHaveLength(13);
    expect(erc20Facet?.readMethods).toHaveLength(6);
    expect(erc20Facet?.writeMethods).toHaveLength(3);
    expect(erc20Facet?.events).toHaveLength(3);
  });

  test("deduplicates exact duplicate events but preserves signature identity", () => {
    const burnableFacet = getAllFacets().find(
      (facet) => facet.name === "BurnableFacet",
    );

    expect(burnableFacet).toBeDefined();
    expect(burnableFacet?.events).toHaveLength(2);
    expect(burnableFacet?.events.map((event) => event.signature)).toEqual([
      "Burn(bytes32,address,address,uint256)",
      "Transfer(address,address,uint256)",
    ]);
  });

  test("extracts the primary Solidity source from the double-brace Etherscan payload", () => {
    const sourceCode = extractPrimarySourceCode(burnableSource);

    expect(sourceCode).toContain("contract BurnableFacet is IBurnable");
    expect(sourceCode).toContain("function burn(");
  });

  test("appends a fallback facet to protocol internals when metadata is missing", () => {
    const registry = new Map(FACET_REGISTRY);
    registry.delete("BurnableFacet");

    const data = assembleArchitectureData({
      allFacets: getAllFacets(),
      clusterDefinitions: BUSINESS_CLUSTERS,
      facetRegistry: registry,
    });

    const fallbackFacet = data.clusters
      .find((cluster) => cluster.id === "protocol-internals")
      ?.facets.find((facet) => facet.name === "BurnableFacet");

    expect(fallbackFacet).toMatchObject({
      displayName: "Burnable",
      cluster: "protocol-internals",
      businessSummary: "No description available — metadata entry required.",
      isFallback: true,
    });
  });
});
