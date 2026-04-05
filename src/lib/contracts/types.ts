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
  proof?: DependencyProof;
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

export interface NatSpecInfo {
  notice?: string;
  dev?: string[];
  params?: Record<string, string>;
  returns?: Record<string, string>;
}

export interface ModifierInfo {
  name: string;
  filePath: string;
  line: number;
  resolvedCall?: string;
  type: "role" | "pause" | "account" | "token" | "other";
}

export interface MethodSourceInfo {
  body: string;
  startLine: number;
  endLine: number;
  filePath: string;
  modifiers: ModifierInfo[];
  natspec?: NatSpecInfo;
}

export interface DependencyProof {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet: string;
  explanation: string;
}

export interface StorageAccessField {
  name: string;
  access: "read" | "write";
}

export interface StorageAccessInfo {
  libraryName: string;
  filePath: string;
  structName: string;
  fields: StorageAccessField[];
}

export interface SourceToken {
  content: string;
  color?: string;
  fontStyle?: number;
}

export interface SourceFileRecord {
  path: string;
  name: string;
  content: string;
  highlightedHtml: string;
  tokenLines: SourceToken[][];
  compilerProfile: string;
  solcVersion: string;
}

export interface SourceFileEntry {
  path: string;
  name: string;
  type: "file" | "directory";
  children?: SourceFileEntry[];
  size?: number;
  solidityVersion?: string;
  compilerProfile?: string;
  solcVersion?: string;
}

export interface ImportGraphEntry {
  filePath: string;
  imports: string[];
  importedBy: string[];
}

export interface SharedLibraryUsage {
  facetName: string;
  displayName: string;
  usageSummary: string;
}

export interface SharedLibraryReference {
  libraryName: string;
  filePath: string;
  compilerProfile: string;
  solcVersion: string;
  usages: SharedLibraryUsage[];
}

export interface ArchitectureFacet extends FacetData, FacetMetadata {
  colorPalette: string;
  address?: string;
  isFallback?: boolean;
  methodSource: Record<string, MethodSourceInfo>;
  relatedSourceFiles: SourceFileRecord[];
  storageAccess: StorageAccessInfo[];
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
  sharedLibraries: SharedLibraryReference[];
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
