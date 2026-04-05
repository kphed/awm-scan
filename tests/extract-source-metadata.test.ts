import { describe, expect, test } from "bun:test";
import { buildSourceMetadata } from "../scripts/extractSourceMetadata";

describe("extractSourceMetadata", () => {
  test("captures source-backed method bodies, NatSpec, and modifier chains", async () => {
    const metadata = await buildSourceMetadata();
    const mintSource =
      metadata.functionBodies.MintableFacet["mint(bytes32,address,uint256)"];
    const mintNatSpec =
      metadata.natspec.MintableFacet["mint(bytes32,address,uint256)"];
    const mintModifiers =
      metadata.modifierChains.MintableFacet["mint(bytes32,address,uint256)"];

    expect(mintSource).toMatchObject({
      filePath: "facets/MintableFacet.sol",
      startLine: 49,
      endLine: 65,
    });
    expect(mintSource.body).toContain("function mint(");
    expect(mintSource.body).toContain("LibMintable._mint");
    expect(mintNatSpec).toMatchObject({
      notice: "Creates a request to mint tokens to the requester address",
      params: {
        requestId_: "id for the request to be created",
        requester_: "address for which request is made",
        amount_: "requested number of tokens to be minted",
      },
      returns: {
        success_: "status of the request to mint (true/false)",
      },
    });
    expect(mintNatSpec?.dev).toContain("MUST revert if contract is paused");
    expect(mintModifiers).toEqual([
      expect.objectContaining({
        name: "whenNotPaused",
        filePath: "facets/MintableFacet.sol",
        line: 57,
        type: "pause",
      }),
      expect.objectContaining({
        name: "whenActiveToken",
        filePath: "facets/MintableFacet.sol",
        line: 58,
        type: "token",
      }),
      expect.objectContaining({
        name: "onlyTokenizationAgent",
        filePath: "facets/MintableFacet.sol",
        line: 59,
        resolvedCall:
          "LibAccessControl._hasRole(LibFactBase.TOKENIZATION_AGENT, msg.sender)",
        type: "role",
      }),
      expect.objectContaining({
        name: "onlyActiveAccount",
        filePath: "facets/MintableFacet.sol",
        line: 60,
        resolvedCall: "LibManagedAccount._accountActive(requester_)",
        type: "account",
      }),
    ]);
  });

  test("captures dependency proofs, shared-library usage, and storage access", async () => {
    const metadata = await buildSourceMetadata();
    const stopCodesProof =
      metadata.dependencyProofs.ERC20FacetTransferBurnableStoppable
        .StopCodesFacet;
    const burnSettlementProof =
      metadata.dependencyProofs.BurnRespondableFacet
        .ERC20FacetTransferBurnableStoppable;
    const stopCodesCrossRef = metadata.libraryCrossReferences["LibStopCodes"];
    const stopCodesStorage =
      metadata.storageAccess.ERC20FacetTransferBurnableStoppable;

    expect(stopCodesProof).toMatchObject({
      filePath: "facets/ERC20FacetTransferBurnableStoppable.sol",
      startLine: 10,
    });
    expect(stopCodesProof.snippet).toContain("LibStopCodes._getStopCodes");
    expect(burnSettlementProof).toMatchObject({
      filePath: "libraries/LibBurnRequestable.sol",
      startLine: 84,
    });
    expect(burnSettlementProof.snippet).toContain("LibERC20.ref()._totalSupply");
    expect(stopCodesCrossRef).toMatchObject({
      libraryName: "LibStopCodes",
      filePath: "libraries/LibStopCodes.sol",
    });
    expect(stopCodesCrossRef.usages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          facetName: "ERC20FacetTransferBurnableStoppable",
          usageSummary:
            "Reads per-account stop codes before allowing transfers or burner-address redemptions.",
        }),
      ]),
    );
    expect(stopCodesStorage).toEqual([
      expect.objectContaining({
        libraryName: "LibStopCodes",
        structName: "StopCodesStorage",
        fields: [
          expect.objectContaining({
            name: "_stopCodes",
            access: "read",
          }),
        ],
      }),
    ]);
  });

  test("builds source explorer metadata with compiler profiles and import graph", async () => {
    const metadata = await buildSourceMetadata();
    const mintFile = metadata.sourceFiles["facets/MintableFacet.sol"];
    const proxyFile = metadata.sourceFiles["diamond-proxy/FactTokenDiamond.sol"];
    const facetsDirectory = metadata.fileTree.find(
      (entry) => entry.path === "facets",
    );

    expect(mintFile).toMatchObject({
      compilerProfile: "default",
      solcVersion: "0.8.26",
    });
    expect(mintFile.highlightedHtml).toContain("function");
    expect(proxyFile).toMatchObject({
      compilerProfile: "diamond-proxy",
      solcVersion: "0.8.17",
    });
    expect(metadata.importGraph["facets/MintableFacet.sol"]).toMatchObject({
      imports: expect.arrayContaining([
        "interfaces/IMintable.sol",
        "libraries/LibMintable.sol",
      ]),
    });
    expect(metadata.fileTree[0]).toMatchObject({
      path: "diamond-proxy",
      type: "directory",
    });
    expect(facetsDirectory).toMatchObject({
      path: "facets",
      type: "directory",
      children: expect.arrayContaining([
        expect.objectContaining({
          path: "facets/MintableFacet.sol",
          type: "file",
          compilerProfile: "default",
          solcVersion: "0.8.26",
        }),
      ]),
    });
  });
});
