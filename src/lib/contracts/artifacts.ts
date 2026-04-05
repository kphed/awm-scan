import AccessControlFacetTimelockableAbi from "@/contracts/abi/AccessControlFacetTimelockable.json";
import BurnPreparableFacetAbi from "@/contracts/abi/BurnPreparableFacet.json";
import BurnRespondableFacetAbi from "@/contracts/abi/BurnRespondableFacet.json";
import BurnableFacetAbi from "@/contracts/abi/BurnableFacet.json";
import DiamondCutFacetAbi from "@/contracts/abi/DiamondCutFacet.json";
import DiamondLoupeFacetAbi from "@/contracts/abi/DiamondLoupeFacet.json";
import ERC165FacetAbi from "@/contracts/abi/ERC165Facet.json";
import ERC173FacetTimelockableAbi from "@/contracts/abi/ERC173FacetTimelockable.json";
import ERC20FacetTransferBurnableStoppableAbi from "@/contracts/abi/ERC20FacetTransferBurnableStoppable.json";
import FactTokenDiamondAbi from "@/contracts/abi/FactTokenDiamond.json";
import ManagedAccountFacetAbi from "@/contracts/abi/ManagedAccountFacet.json";
import ManagedTokenFacetTimelockableAbi from "@/contracts/abi/ManagedTokenFacetTimelockable.json";
import MintableFacetAbi from "@/contracts/abi/MintableFacet.json";
import PausableFacetTimelockableAbi from "@/contracts/abi/PausableFacetTimelockable.json";
import StopCodesFacetAbi from "@/contracts/abi/StopCodesFacet.json";
import TimelockableFacetAbi from "@/contracts/abi/TimelockableFacet.json";
import TokenMetadataFacetAbi from "@/contracts/abi/TokenMetadataFacet.json";
import AccessControlFacetTimelockableSource from "@/contracts/source/AccessControlFacetTimelockable.json";
import BurnPreparableFacetSource from "@/contracts/source/BurnPreparableFacet.json";
import BurnRespondableFacetSource from "@/contracts/source/BurnRespondableFacet.json";
import BurnableFacetSource from "@/contracts/source/BurnableFacet.json";
import DiamondCutFacetSource from "@/contracts/source/DiamondCutFacet.json";
import DiamondLoupeFacetSource from "@/contracts/source/DiamondLoupeFacet.json";
import ERC165FacetSource from "@/contracts/source/ERC165Facet.json";
import ERC173FacetTimelockableSource from "@/contracts/source/ERC173FacetTimelockable.json";
import ERC20FacetTransferBurnableStoppableSource from "@/contracts/source/ERC20FacetTransferBurnableStoppable.json";
import FactTokenDiamondSource from "@/contracts/source/FactTokenDiamond.json";
import ManagedAccountFacetSource from "@/contracts/source/ManagedAccountFacet.json";
import ManagedTokenFacetTimelockableSource from "@/contracts/source/ManagedTokenFacetTimelockable.json";
import MintableFacetSource from "@/contracts/source/MintableFacet.json";
import PausableFacetTimelockableSource from "@/contracts/source/PausableFacetTimelockable.json";
import StopCodesFacetSource from "@/contracts/source/StopCodesFacet.json";
import TimelockableFacetSource from "@/contracts/source/TimelockableFacet.json";
import TokenMetadataFacetSource from "@/contracts/source/TokenMetadataFacet.json";
import type { ContractSourceArtifact, RawAbiEntry } from "./types";

// Keep the artifact maps static so the build has a single source of truth for
// both ABI parsing and source-viewer lookups.
export const ABI_ARTIFACTS = {
  AccessControlFacetTimelockable: AccessControlFacetTimelockableAbi,
  BurnPreparableFacet: BurnPreparableFacetAbi,
  BurnRespondableFacet: BurnRespondableFacetAbi,
  BurnableFacet: BurnableFacetAbi,
  DiamondCutFacet: DiamondCutFacetAbi,
  DiamondLoupeFacet: DiamondLoupeFacetAbi,
  ERC165Facet: ERC165FacetAbi,
  ERC173FacetTimelockable: ERC173FacetTimelockableAbi,
  ERC20FacetTransferBurnableStoppable: ERC20FacetTransferBurnableStoppableAbi,
  FactTokenDiamond: FactTokenDiamondAbi,
  ManagedAccountFacet: ManagedAccountFacetAbi,
  ManagedTokenFacetTimelockable: ManagedTokenFacetTimelockableAbi,
  MintableFacet: MintableFacetAbi,
  PausableFacetTimelockable: PausableFacetTimelockableAbi,
  StopCodesFacet: StopCodesFacetAbi,
  TimelockableFacet: TimelockableFacetAbi,
  TokenMetadataFacet: TokenMetadataFacetAbi,
} satisfies Record<string, RawAbiEntry[]>;

export const SOURCE_ARTIFACTS = {
  AccessControlFacetTimelockable: AccessControlFacetTimelockableSource,
  BurnPreparableFacet: BurnPreparableFacetSource,
  BurnRespondableFacet: BurnRespondableFacetSource,
  BurnableFacet: BurnableFacetSource,
  DiamondCutFacet: DiamondCutFacetSource,
  DiamondLoupeFacet: DiamondLoupeFacetSource,
  ERC165Facet: ERC165FacetSource,
  ERC173FacetTimelockable: ERC173FacetTimelockableSource,
  ERC20FacetTransferBurnableStoppable:
    ERC20FacetTransferBurnableStoppableSource,
  FactTokenDiamond: FactTokenDiamondSource,
  ManagedAccountFacet: ManagedAccountFacetSource,
  ManagedTokenFacetTimelockable: ManagedTokenFacetTimelockableSource,
  MintableFacet: MintableFacetSource,
  PausableFacetTimelockable: PausableFacetTimelockableSource,
  StopCodesFacet: StopCodesFacetSource,
  TimelockableFacet: TimelockableFacetSource,
  TokenMetadataFacet: TokenMetadataFacetSource,
} satisfies Record<string, ContractSourceArtifact>;

export const FACT_TOKEN_DIAMOND_ADDRESS =
  SOURCE_ARTIFACTS.FactTokenDiamond.address ?? "";
