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

  test("reflects the approved registry audit corrections", () => {
    const burnRespondableFacet = FACET_REGISTRY.get("BurnRespondableFacet");
    const erc20Facet = FACET_REGISTRY.get(
      "ERC20FacetTransferBurnableStoppable",
    );
    const accessControlFacet = FACET_REGISTRY.get(
      "AccessControlFacetTimelockable",
    );
    const managedTokenFacet = FACET_REGISTRY.get(
      "ManagedTokenFacetTimelockable",
    );
    const managedAccountFacet = FACET_REGISTRY.get("ManagedAccountFacet");
    const timelockableFacet = FACET_REGISTRY.get("TimelockableFacet");
    const pausableFacet = FACET_REGISTRY.get("PausableFacetTimelockable");

    expect(burnRespondableFacet?.dependencies).toEqual([
      {
        target: "BurnPreparableFacet",
        relationship: "Approves or rejects requests created by intake",
        direction: "uses",
        type: "workflow",
      },
      {
        target: "ERC20FacetTransferBurnableStoppable",
        relationship:
          "Approved or rejected staged burns mutate shared ERC-20 balances and supply",
        direction: "uses",
        type: "shared-state",
      },
    ]);
    expect(erc20Facet).toMatchObject({
      businessSummary:
        "Implements the core ERC-20 balance, transfer, and approval flows, while stop codes gate movement and burner-address transfers create pending redemption requests.",
      dependencies: [
        {
          target: "StopCodesFacet",
          relationship:
            "Reads per-account stop codes before allowing transfers",
          direction: "uses",
          type: "shared-state",
        },
      ],
    });
    expect(managedTokenFacet).toMatchObject({
      businessSummary:
        "Re-activates the fund token through a timelocked control path while direct deactivation remains on the token-admin surface.",
      operationalImpact:
        "Governance can delay re-enabling the token after an incident, but token admins can still deactivate immediately when risk appears.",
      dependencies: [
        {
          target: "TimelockableFacet",
          relationship:
            "activateToken executes only after a queued timelock transaction",
          direction: "uses",
          type: "governance",
        },
      ],
    });
    expect(managedAccountFacet?.dependencies).toEqual([
      {
        target: "ERC20FacetTransferBurnableStoppable",
        relationship:
          "Locks, force-transfers, and forced burns mutate the shared ERC-20 ledger",
        direction: "uses",
        type: "shared-state",
      },
    ]);
    expect(accessControlFacet).toMatchObject({
      businessSummary:
        "Grants and renounces operational roles through timelocked controls, while role revocation by the admin remains direct.",
      operationalImpact:
        "Governance can delay new role assignments and self-renouncements, but admin-initiated revocations execute immediately for rapid incident response.",
      dependencies: [
        {
          target: "TimelockableFacet",
          relationship:
            "grantRole and renounceRole execute only after the timelock delay",
          direction: "uses",
          type: "governance",
        },
      ],
    });
    expect(timelockableFacet?.requiredRoles).toEqual([
      "TOKEN_ADMIN",
      "ACCOUNT_ADMIN",
      "TOKENIZATION_AGENT",
    ]);
    expect(pausableFacet).toMatchObject({
      businessSummary:
        "Pauses the fund token directly as TOKEN_ADMIN and unpauses it through the timelock execution path.",
      operationalImpact:
        "Operations can halt activity immediately during an incident, while re-enabling the token still waits for the queued governance window.",
      dependencies: [
        {
          target: "TimelockableFacet",
          relationship: "unpause executes only after the timelock delay",
          direction: "uses",
          type: "governance",
        },
        {
          target: "ERC20FacetTransferBurnableStoppable",
          relationship:
            "The shared pause rail halts ERC-20 transfer and approval flows",
          direction: "used-by",
          type: "shared-state",
        },
      ],
    });
  });

  test("keeps lifecycle flow timelines aligned with direct and timelocked governance paths", () => {
    const emergencyPauseFlow = LIFECYCLE_FLOWS.find(
      (flow) => flow.id === "emergency-pause",
    );
    const moduleUpgradeFlow = LIFECYCLE_FLOWS.find(
      (flow) => flow.id === "module-upgrade",
    );

    expect(emergencyPauseFlow?.steps).toEqual([
      {
        label: "Pause Initiated",
        description:
          "A token admin pauses the contract directly so transfers, mints, and burns halt immediately.",
        facetName: "PausableFacetTimelockable",
        methodName: "pause",
        actor: "Governance",
        isOnChain: true,
      },
      {
        label: "Transfers Halted",
        description:
          "All guarded operations revert while the pause flag remains active.",
        facetName: "ERC20FacetTransferBurnableStoppable",
        actor: "System",
        isOnChain: true,
      },
      {
        label: "Unpause Queued",
        description:
          "Once the incident is contained, the token admin queues the unpause action through the governance timelock.",
        facetName: "TimelockableFacet",
        methodName: "queueTransaction",
        actor: "Governance",
        isOnChain: true,
      },
      {
        label: "Timelock Delay",
        description:
          "The queued unpause waits through the governance delay window before execution opens.",
        facetName: "TimelockableFacet",
        actor: "System",
        isOnChain: true,
      },
      {
        label: "Unpause Executed",
        description:
          "After the delay expires, the token admin executes unpause and resumes activity.",
        facetName: "PausableFacetTimelockable",
        methodName: "unpause",
        actor: "Governance",
        isOnChain: true,
      },
    ]);
    expect(moduleUpgradeFlow?.steps).toEqual([
      {
        label: "Upgrade Prepared",
        description:
          "The contract owner prepares the DiamondCut payload off-chain with the selectors to add, replace, or remove.",
        facetName: "DiamondCutFacet",
        actor: "Governance",
        isOnChain: false,
      },
      {
        label: "Cut Executed",
        description:
          "The owner calls diamondCut directly to update the Diamond routing table to the new module set.",
        facetName: "DiamondCutFacet",
        methodName: "diamondCut",
        actor: "Governance",
        isOnChain: true,
      },
      {
        label: "Loupe Reflects Changes",
        description:
          "The Diamond Loupe returns the updated list of facets, addresses, and selectors.",
        facetName: "DiamondLoupeFacet",
        methodName: "facets",
        actor: "System",
        isOnChain: true,
      },
    ]);
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
    expect(matrix.get("TOKEN_ADMIN")?.has("TimelockableFacet")).toBe(true);
    expect(matrix.get("ACCOUNT_ADMIN")?.has("TimelockableFacet")).toBe(true);
    expect(matrix.get("TOKENIZATION_AGENT")?.has("TimelockableFacet")).toBe(
      true,
    );
    expect(writeMethodsByFacet.get("MintableFacet")).toContain("mint");
  });
});
