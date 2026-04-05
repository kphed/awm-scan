export interface FlowStep {
  label: string;
  description: string;
  facetName: string;
  methodName?: string;
  actor: "Operator" | "Investor" | "System" | "Governance";
  isOnChain: boolean;
}

export interface LifecycleFlow {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  relatedFlows?: string[];
}

export const LIFECYCLE_FLOWS: LifecycleFlow[] = [
  {
    id: "subscription-mint",
    name: "New Subscription (Mint)",
    description:
      "End-to-end flow from cleared subscription capital to fund tokens in the investor wallet.",
    steps: [
      {
        label: "Capital Accepted",
        description:
          "The fund administrator confirms capital has cleared and the investor is approved for issuance.",
        facetName: "MintableFacet",
        actor: "Operator",
        isOnChain: false,
      },
      {
        label: "Compliance Check",
        description:
          "The system verifies the account status and stop codes allow subscriptions.",
        facetName: "StopCodesFacet",
        methodName: "getStopCodes",
        actor: "System",
        isOnChain: true,
      },
      {
        label: "Token Mint",
        description:
          "The tokenization agent mints the corresponding fund tokens to the investor wallet.",
        facetName: "MintableFacet",
        methodName: "mint",
        actor: "Operator",
        isOnChain: true,
      },
      {
        label: "Balance Updated",
        description: "The ERC-20 balance reflects the newly minted position.",
        facetName: "ERC20FacetTransferBurnableStoppable",
        actor: "System",
        isOnChain: true,
      },
    ],
    relatedFlows: ["immediate-redemption", "gated-redemption"],
  },
  {
    id: "immediate-redemption",
    name: "Immediate Redemption (Burn)",
    description:
      "Direct token burn when a redemption can settle without a staged approval path.",
    steps: [
      {
        label: "Redemption Requested",
        description:
          "The investor or operator initiates a redemption for the specified token amount.",
        facetName: "BurnableFacet",
        actor: "Operator",
        isOnChain: false,
      },
      {
        label: "Compliance Check",
        description:
          "The system verifies the investor account and stop codes allow redemptions.",
        facetName: "StopCodesFacet",
        methodName: "getStopCodes",
        actor: "System",
        isOnChain: true,
      },
      {
        label: "Token Burn",
        description:
          "The tokenization agent burns the tokens directly from the investor balance.",
        facetName: "BurnableFacet",
        methodName: "burn",
        actor: "Operator",
        isOnChain: true,
      },
      {
        label: "Supply Reduced",
        description:
          "The total supply and investor balance decrease to reflect the completed redemption.",
        facetName: "ERC20FacetTransferBurnableStoppable",
        actor: "System",
        isOnChain: true,
      },
    ],
    relatedFlows: ["subscription-mint", "gated-redemption"],
  },
  {
    id: "gated-redemption",
    name: "Gated Redemption (Prepare → Approve → Burn)",
    description:
      "Two-phase redemption where requests are queued for review before the burn settles.",
    steps: [
      {
        label: "Request Queued",
        description:
          "The tokenization agent creates a pending redemption request for the investor and amount.",
        facetName: "BurnPreparableFacet",
        methodName: "prepareBurn",
        actor: "Operator",
        isOnChain: true,
      },
      {
        label: "Request Review",
        description:
          "Operations reviews the pending request against compliance and liquidity constraints.",
        facetName: "BurnRespondableFacet",
        actor: "Operator",
        isOnChain: false,
      },
      {
        label: "Request Approved",
        description:
          "The tokenization agent approves the pending burn request and triggers the final settlement path.",
        facetName: "BurnRespondableFacet",
        methodName: "approveBurn",
        actor: "Operator",
        isOnChain: true,
      },
      {
        label: "Burn Executed",
        description:
          "The burn module removes the approved tokens from circulation and updates balances.",
        facetName: "BurnableFacet",
        methodName: "burn",
        actor: "System",
        isOnChain: true,
      },
      {
        label: "Request Rejected",
        description:
          "Alternatively, the tokenization agent rejects the queued request and leaves the investor balance unchanged.",
        facetName: "BurnRespondableFacet",
        methodName: "rejectBurn",
        actor: "Operator",
        isOnChain: true,
      },
    ],
    relatedFlows: ["immediate-redemption"],
  },
  {
    id: "emergency-pause",
    name: "Emergency Pause",
    description:
      "Halt token activity during an incident and resume once the risk is cleared.",
    steps: [
      {
        label: "Pause Initiated",
        description:
          "A token admin submits the pause action to halt token activity.",
        facetName: "PausableFacetTimelockable",
        methodName: "pause",
        actor: "Governance",
        isOnChain: true,
      },
      {
        label: "Timelock Delay",
        description:
          "The action moves through the governance delay window before it can take effect.",
        facetName: "TimelockableFacet",
        actor: "System",
        isOnChain: true,
      },
      {
        label: "Transfers Halted",
        description:
          "Transfers, mints, and burns are blocked while the token remains paused.",
        facetName: "ERC20FacetTransferBurnableStoppable",
        actor: "System",
        isOnChain: true,
      },
      {
        label: "Unpause When Clear",
        description:
          "Once operations clears the incident, governance unpauses the token and resumes activity.",
        facetName: "PausableFacetTimelockable",
        methodName: "unpause",
        actor: "Governance",
        isOnChain: true,
      },
    ],
  },
  {
    id: "module-upgrade",
    name: "Diamond Module Upgrade",
    description: "Add, replace, or remove a facet module on the Diamond proxy.",
    steps: [
      {
        label: "Upgrade Proposed",
        description:
          "The owner prepares a DiamondCut transaction with the selectors to add, replace, or remove.",
        facetName: "DiamondCutFacet",
        methodName: "diamondCut",
        actor: "Governance",
        isOnChain: true,
      },
      {
        label: "Timelock Delay",
        description:
          "The cut enters the governance queue so operators have a review window before execution.",
        facetName: "TimelockableFacet",
        actor: "System",
        isOnChain: true,
      },
      {
        label: "Cut Executed",
        description:
          "After the delay expires, the Diamond routing table is updated to the new module set.",
        facetName: "DiamondCutFacet",
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
    ],
  },
];
