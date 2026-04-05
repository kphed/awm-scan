import { describe, expect, test } from "bun:test";
import burnableSource from "../src/contracts/source/BurnableFacet.json";
import {
  assembleArchitectureData,
  derivePermissionMatrix,
  extractPrimarySourceCode,
  getEventDescription,
  getAllFacets,
  getMethodDescription,
} from "../src/lib/contracts";
import { LIFECYCLE_FLOWS } from "../src/lib/contracts/flows";
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

  test("threads verified deployment addresses into assembled facets", () => {
    const data = assembleArchitectureData();
    const burnableFacet = data.clusters
      .flatMap((cluster) => cluster.facets)
      .find((facet) => facet.name === "BurnableFacet");

    expect(burnableFacet?.address).toBe(
      "0x88183F91a0A7315BD3e2102BE7520c88cE9EFF67",
    );
  });

  test("returns authored method and event descriptions when present", () => {
    expect(getMethodDescription("mint(bytes32,address,uint256)")).toContain(
      "Creates new fund tokens",
    );
    expect(
      getEventDescription("Burn(bytes32,address,address,uint256)"),
    ).toContain("burn");
    expect(getMethodDescription("owner()")).toBeNull();
  });

  test("keeps dependency targets aligned with the facet registry", () => {
    for (const metadata of FACET_REGISTRY.values()) {
      for (const dependency of metadata.dependencies ?? []) {
        expect(FACET_REGISTRY.has(dependency.target)).toBe(true);
      }
    }
  });

  test("keeps lifecycle flow facet references aligned with assembled facets", () => {
    const facetsByName = new Map(
      assembleArchitectureData()
        .clusters.flatMap((cluster) => cluster.facets)
        .map((facet) => [facet.name, facet]),
    );

    for (const flow of LIFECYCLE_FLOWS) {
      for (const step of flow.steps) {
        expect(
          facetsByName.has(step.facetName),
          `${flow.id}:${step.label}:${step.facetName}`,
        ).toBe(true);
      }
    }
  });

  test("keeps lifecycle flow method references aligned with facet ABIs", () => {
    const facetsByName = new Map(
      assembleArchitectureData()
        .clusters.flatMap((cluster) => cluster.facets)
        .map((facet) => [facet.name, facet]),
    );

    for (const flow of LIFECYCLE_FLOWS) {
      for (const step of flow.steps) {
        if (!step.methodName) {
          continue;
        }

        const facet = facetsByName.get(step.facetName);
        const facetMethods = [
          ...(facet?.readMethods ?? []),
          ...(facet?.writeMethods ?? []),
        ].map((method) => method.name);

        expect(
          facetMethods,
          `${flow.id}:${step.label}:${step.methodName}`,
        ).toContain(step.methodName);
      }
    }
  });

  test("orders permission-matrix roles alphabetically with PUBLIC last", () => {
    const { roles, matrix, writeMethodsByFacet } = derivePermissionMatrix(
      assembleArchitectureData(),
    );

    expect(roles.at(-1)).toBe("PUBLIC");
    expect(roles.slice(0, -1)).toEqual(
      [...roles.slice(0, -1)].sort((left, right) => left.localeCompare(right)),
    );
    expect(Array.from(matrix.get("PUBLIC") ?? [])).toEqual([
      "ERC20FacetTransferBurnableStoppable",
    ]);
    expect(writeMethodsByFacet.get("MintableFacet")).toContain("mint");
  });
});
