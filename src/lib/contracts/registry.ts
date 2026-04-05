import type { ClusterDefinition, FacetMetadata } from "./types";

const FACET_METADATA: FacetMetadata[] = [
  {
    name: "MintableFacet",
    displayName: "Subscription Processing",
    cluster: "subscriptions-redemptions",
    businessSummary:
      "Creates MONY fund tokens when new subscription capital is accepted.",
    operationalImpact:
      "This is the fund's intake rail. Once capital clears and the subscription is approved, operations can mint the matching token position for the investor.",
    requiredRoles: ["TOKENIZATION_AGENT"],
    dependencies: [
      {
        target: "ERC20FacetTransferBurnableStoppable",
        relationship: "Minted tokens become ERC-20 balances",
        direction: "uses",
        type: "shared-state",
      },
    ],
  },
  {
    name: "BurnableFacet",
    displayName: "Immediate Redemptions",
    cluster: "subscriptions-redemptions",
    businessSummary:
      "Executes direct token burns when an authorized redemption request can settle immediately.",
    operationalImpact:
      "This module handles the fast path for taking supply out of circulation without a staged approval workflow.",
    requiredRoles: ["TOKENIZATION_AGENT"],
    dependencies: [
      {
        target: "ERC20FacetTransferBurnableStoppable",
        relationship: "Burns reduce ERC-20 supply and balances",
        direction: "uses",
        type: "shared-state",
      },
    ],
  },
  {
    name: "BurnPreparableFacet",
    displayName: "Redemption Intake",
    cluster: "subscriptions-redemptions",
    businessSummary:
      "Creates pending redemption requests before supply is reduced.",
    operationalImpact:
      "This is the queueing step for gated redemptions, giving operations an audit trail before capital leaves the fund.",
    requiredRoles: ["TOKENIZATION_AGENT"],
    requiredRolesNote:
      "Source also requires the burner_ argument to already hold the BURNER role.",
    dependencies: [
      {
        target: "BurnRespondableFacet",
        relationship: "Queued requests are resolved by the approval facet",
        direction: "uses",
        type: "workflow",
      },
      {
        target: "ERC20FacetTransferBurnableStoppable",
        relationship:
          "Preparing a burn moves the requested balance into the burner account while the request stays pending",
        direction: "uses",
        type: "shared-state",
      },
    ],
  },
  {
    name: "BurnRespondableFacet",
    displayName: "Redemption Approval",
    cluster: "subscriptions-redemptions",
    businessSummary:
      "Approves, rejects, and inspects pending redemption requests.",
    operationalImpact:
      "This is the review queue for staged redemptions: approval settles the burn immediately, while rejection returns the staged balance to the requester.",
    requiredRoles: ["TOKENIZATION_AGENT"],
    dependencies: [
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
    ],
  },
  {
    name: "ERC20FacetTransferBurnableStoppable",
    displayName: "Token Transfers",
    cluster: "fund-token",
    businessSummary:
      "Implements the core ERC-20 balance, transfer, and approval flows, while stop codes gate movement and burner-address transfers create pending redemption requests.",
    operationalImpact:
      "This is the investor-facing token ledger. Wallet balances, transfers, and allowance-based operations all flow through this module.",
    eipReference: "EIP-20",
    requiredRoles: [],
    dependencies: [
      {
        target: "StopCodesFacet",
        relationship: "Reads per-account stop codes before allowing transfers",
        direction: "uses",
        type: "shared-state",
      },
    ],
  },
  {
    name: "TokenMetadataFacet",
    displayName: "Token Identity",
    cluster: "fund-token",
    businessSummary:
      "Stores and updates the token metadata that describes the fund asset.",
    operationalImpact:
      "This is the reference layer for business-facing token details that downstream systems and interfaces display.",
    requiredRoles: ["TOKEN_ADMIN"],
  },
  {
    name: "ManagedTokenFacetTimelockable",
    displayName: "Token Status Controls",
    cluster: "fund-token",
    businessSummary:
      "Re-activates the fund token through a timelocked control path while direct deactivation remains on the token-admin surface.",
    operationalImpact:
      "Governance can delay re-enabling the token after an incident, but token admins can still deactivate immediately when risk appears.",
    requiredRoles: ["TOKEN_ADMIN"],
    dependencies: [
      {
        target: "TimelockableFacet",
        relationship:
          "activateToken executes only after a queued timelock transaction",
        direction: "uses",
        type: "governance",
      },
    ],
  },
  {
    name: "ManagedAccountFacet",
    displayName: "Account Controls",
    cluster: "investor-compliance",
    businessSummary:
      "Applies account-level actions such as activation, locks, force transfers, and forced burns.",
    operationalImpact:
      "This is the compliance operations console for investor accounts, covering freezes, seizures, remediation, and batch enforcement flows.",
    requiredRoles: ["ACCOUNT_ADMIN"],
    dependencies: [
      {
        target: "ERC20FacetTransferBurnableStoppable",
        relationship:
          "Locks, force-transfers, and forced burns mutate the shared ERC-20 ledger",
        direction: "uses",
        type: "shared-state",
      },
    ],
  },
  {
    name: "StopCodesFacet",
    displayName: "Transfer Restrictions",
    cluster: "investor-compliance",
    businessSummary:
      "Sets per-account stop-code restrictions for subscriptions, transfers, and redemptions.",
    operationalImpact:
      "This module gives compliance teams fine-grained per-investor controls instead of relying on a single global pause switch.",
    requiredRoles: ["ACCOUNT_ADMIN"],
  },
  {
    name: "ERC173FacetTimelockable",
    displayName: "Ownership Controls",
    cluster: "governance-admin",
    businessSummary:
      "Manages contract ownership changes behind a timelocked approval path.",
    operationalImpact:
      "This is the top-level governance handoff mechanism for who ultimately controls the fund's on-chain contract shell.",
    eipReference: "EIP-173",
    requiredRoles: ["OWNER"],
    dependencies: [
      {
        target: "TimelockableFacet",
        relationship: "Ownership transfers go through timelock delay",
        direction: "uses",
        type: "governance",
      },
    ],
  },
  {
    name: "AccessControlFacetTimelockable",
    displayName: "Role Administration",
    cluster: "governance-admin",
    businessSummary:
      "Grants and renounces operational roles through timelocked controls, while role revocation by the admin remains direct.",
    operationalImpact:
      "Governance can delay new role assignments and self-renouncements, but admin-initiated revocations execute immediately for rapid incident response.",
    requiredRoles: ["DEFAULT_ADMIN_ROLE"],
    requiredRolesNote:
      "Displayed DEFAULT_ADMIN_ROLE is registry shorthand: grantRole first passes the timelock and then getRoleAdmin(role), revokeRole uses getRoleAdmin(role) directly, and renounceRole is self-confirmed by the caller.",
    dependencies: [
      {
        target: "TimelockableFacet",
        relationship:
          "grantRole and renounceRole execute only after the timelock delay",
        direction: "uses",
        type: "governance",
      },
    ],
  },
  {
    name: "TimelockableFacet",
    displayName: "Governance Timelock",
    cluster: "governance-admin",
    businessSummary:
      "Queues, revokes, and executes delayed administrative actions.",
    operationalImpact:
      "This is the operational safety rail that forces sensitive actions through a review window before they can take effect.",
    requiredRoles: ["TOKEN_ADMIN", "ACCOUNT_ADMIN", "TOKENIZATION_AGENT"],
  },
  {
    name: "PausableFacetTimelockable",
    displayName: "Emergency Pause",
    cluster: "governance-admin",
    businessSummary:
      "Pauses the fund token directly as TOKEN_ADMIN and unpauses it through the timelock execution path.",
    operationalImpact:
      "Operations can halt activity immediately during an incident, while re-enabling the token still waits for the queued governance window.",
    requiredRoles: ["TOKEN_ADMIN"],
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
  },
  {
    name: "DiamondCutFacet",
    displayName: "Module Upgrades",
    cluster: "protocol-internals",
    businessSummary:
      "Adds, replaces, or removes Diamond modules and their function selectors.",
    operationalImpact:
      "This is the upgrade mechanism that changes which modules the MONY Fund Token can delegate into.",
    eipReference: "EIP-2535",
    requiredRoles: ["OWNER"],
    dependencies: [
      {
        target: "DiamondLoupeFacet",
        relationship: "Loupe reflects the current module set after a cut",
        direction: "uses",
        type: "introspection",
      },
    ],
  },
  {
    name: "DiamondLoupeFacet",
    displayName: "Contract Inspector",
    cluster: "protocol-internals",
    businessSummary:
      "Lists facets, addresses, and function selectors for the Diamond proxy.",
    operationalImpact:
      "This is the protocol inventory endpoint used by engineers and auditors to verify the current module composition.",
    eipReference: "EIP-2535",
    requiredRoles: [],
  },
  {
    name: "ERC165Facet",
    displayName: "Interface Registry",
    cluster: "protocol-internals",
    businessSummary:
      "Declares which interfaces the contract stack currently supports.",
    operationalImpact:
      "This module helps external integrations and auditors confirm which standards the protocol exposes.",
    eipReference: "EIP-165",
    requiredRoles: ["OWNER"],
  },
];

export const FACET_REGISTRY = new Map(
  FACET_METADATA.map((metadata) => [metadata.name, metadata]),
);

export const BUSINESS_CLUSTERS: ClusterDefinition[] = [
  {
    id: "subscriptions-redemptions",
    label: "Subscriptions & Redemptions",
    subtitle: "How money flows in and out of the fund",
    colorPalette: "green",
    facetNames: [
      "MintableFacet",
      "BurnableFacet",
      "BurnPreparableFacet",
      "BurnRespondableFacet",
    ],
  },
  {
    id: "fund-token",
    label: "Fund Token",
    subtitle: "What investors hold and how the token behaves",
    colorPalette: "blue",
    facetNames: [
      "ERC20FacetTransferBurnableStoppable",
      "TokenMetadataFacet",
      "ManagedTokenFacetTimelockable",
    ],
  },
  {
    id: "investor-compliance",
    label: "Investor Compliance",
    subtitle: "Per-account controls for legal and regulatory enforcement",
    colorPalette: "red",
    facetNames: ["ManagedAccountFacet", "StopCodesFacet"],
  },
  {
    id: "governance-admin",
    label: "Governance & Administration",
    subtitle: "Who can operate the fund and what safeguards apply",
    colorPalette: "purple",
    facetNames: [
      "ERC173FacetTimelockable",
      "AccessControlFacetTimelockable",
      "TimelockableFacet",
      "PausableFacetTimelockable",
    ],
  },
  {
    id: "protocol-internals",
    label: "Protocol Internals",
    subtitle: "Diamond module wiring and interface registration",
    colorPalette: "gray",
    facetNames: ["DiamondCutFacet", "DiamondLoupeFacet", "ERC165Facet"],
  },
];
