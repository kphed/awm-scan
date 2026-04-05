export interface AbiParam {
  name: string;
  type: string;
  indexed?: boolean;
  components?: AbiParam[];
}

export interface ParsedMethod {
  name: string;
  signature: string;
  inputs: AbiParam[];
  outputs: AbiParam[];
  stateMutability: "view" | "pure" | "nonpayable" | "payable";
}

export interface ParsedEvent {
  name: string;
  signature: string;
  inputs: AbiParam[];
}

export interface FacetData {
  name: string;
  readMethods: ParsedMethod[];
  writeMethods: ParsedMethod[];
  events: ParsedEvent[];
  hasConstructor: boolean;
}

export type BusinessCluster =
  | "subscriptions-redemptions"
  | "fund-token"
  | "investor-compliance"
  | "governance-admin"
  | "protocol-internals";

export interface FacetDependency {
  target: string;
  relationship: string;
  direction: "uses" | "used-by";
  type?: "workflow" | "shared-state" | "governance" | "introspection";
}

export interface FacetMetadata {
  name: string;
  displayName: string;
  cluster: BusinessCluster;
  businessSummary: string;
  operationalImpact: string;
  eipReference?: string;
  requiredRoles: string[];
  requiredRolesNote?: string;
  dependencies?: FacetDependency[];
}

export interface ClusterDefinition {
  id: BusinessCluster;
  label: string;
  subtitle: string;
  colorPalette: string;
  facetNames: string[];
}

export interface ArchitectureFacet extends FacetData, FacetMetadata {
  colorPalette: string;
  address?: string;
  isFallback?: boolean;
}

export interface ClusterGroup {
  id: BusinessCluster;
  label: string;
  subtitle: string;
  colorPalette: string;
  facets: ArchitectureFacet[];
}

export interface DiamondProxyData extends FacetData {
  address: string;
  technicalName: string;
  displayName: string;
}

export interface ArchitectureStats {
  totalFacets: number;
  totalFunctions: number;
  totalEvents: number;
}

export interface ArchitectureData {
  clusters: ClusterGroup[];
  diamondProxy: DiamondProxyData;
  stats: ArchitectureStats;
}

export interface SourceFileRecord {
  content?: string;
}

export interface SourceArtifactPayload {
  sources?: Record<string, SourceFileRecord>;
}

export interface ContractSourceArtifactEntry {
  SourceCode: string;
  ContractFileName?: string;
  ContractName?: string;
}

export interface ContractSourceArtifact {
  "0"?: ContractSourceArtifactEntry;
  address?: string;
}

export interface RawAbiParameter {
  name?: string;
  type: string;
  indexed?: boolean;
  components?: RawAbiParameter[];
}

export interface RawAbiEntry {
  type: string;
  name?: string;
  inputs?: RawAbiParameter[];
  outputs?: RawAbiParameter[];
  stateMutability?: string;
}
