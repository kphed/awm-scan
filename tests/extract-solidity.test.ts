import { describe, expect, test } from "bun:test";
import burnableBundle from "../src/contracts/source/BurnableFacet.json";
import diamondCutBundle from "../src/contracts/source/DiamondCutFacet.json";
import erc20TransferBurnableStoppableBundle from "../src/contracts/source/ERC20FacetTransferBurnableStoppable.json";
import factTokenDiamondBundle from "../src/contracts/source/FactTokenDiamond.json";
import {
  mapSourcePathToTarget,
  parseBundle,
  planBundleWrites,
} from "../scripts/extractSolidity";

describe("extractSolidity", () => {
  test("parses the repo's wrapped Etherscan bundle format", () => {
    const bundle = parseBundle(burnableBundle);

    expect(bundle.address).toBe("0x88183F91a0A7315BD3e2102BE7520c88cE9EFF67");
    expect(bundle.compilerVersion).toBe("v0.8.26+commit.8a97fa7a");
    expect(bundle.contractFileName).toBe("contracts/facets/BurnableFacet.sol");
    expect(bundle.sources["contracts/facets/BurnableFacet.sol"]).toContain(
      "contract BurnableFacet is IBurnable",
    );
  });

  test("maps @odaplatform imports into the default Foundry src tree", () => {
    const bundle = parseBundle(erc20TransferBurnableStoppableBundle);
    const sourcePath =
      "@odaplatform/da-fact-smartcontracts/contracts/libraries/LibERC20.sol";

    expect(bundle.sources[sourcePath]).toContain("library LibERC20");
    expect(mapSourcePathToTarget(sourcePath, bundle.compilerVersion)).toBe(
      "src/libraries/LibERC20.sol",
    );
  });

  test("skips OpenZeppelin sources because Foundry installs them separately", () => {
    const bundle = parseBundle(erc20TransferBurnableStoppableBundle);
    const sourcePath = "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

    expect(bundle.sources[sourcePath]).toContain("library EnumerableSet");
    expect(mapSourcePathToTarget(sourcePath, bundle.compilerVersion)).toBeNull();
  });

  test("routes the 0.8.17 diamond proxy subset into an isolated tree", () => {
    const bundle = parseBundle(factTokenDiamondBundle);

    expect(
      mapSourcePathToTarget("contracts/FactTokenDiamond.sol", bundle.compilerVersion),
    ).toBe("src/diamond-proxy/FactTokenDiamond.sol");
    expect(
      mapSourcePathToTarget(
        "contracts/libraries/LibDiamond.sol",
        bundle.compilerVersion,
      ),
    ).toBe("src/diamond-proxy/libraries/LibDiamond.sol");
    expect(
      mapSourcePathToTarget(
        "contracts/interfaces/IDiamond.sol",
        bundle.compilerVersion,
      ),
    ).toBe("src/diamond-proxy/interfaces/IDiamond.sol");
  });

  test("plans writes without colliding the proxy LibDiamond with the facet variant", () => {
    const writes = planBundleWrites([
      parseBundle(diamondCutBundle),
      parseBundle(factTokenDiamondBundle),
    ]);
    const targets = new Map(writes.map((write) => [write.targetPath, write]));

    expect(targets.get("src/libraries/LibDiamond.sol")?.compilerVersion).toBe(
      "v0.8.26+commit.8a97fa7a",
    );
    expect(
      targets.get("src/diamond-proxy/libraries/LibDiamond.sol")?.compilerVersion,
    ).toBe("v0.8.17+commit.8df45f5f");
    expect(targets.get("src/diamond-proxy/FactTokenDiamond.sol")).toBeDefined();
  });
});
