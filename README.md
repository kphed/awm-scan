# awm-scan

AWM Scan is a Next.js app for understanding the JPM MONY protocol through a
product-facing lens. The repo combines:

- a Chakra UI frontend that explains the MONY Diamond Proxy architecture in
  business terms
- a local Solidity workspace under `contracts/` with the extracted MONY source
  tree ready for Foundry builds and future audit work
- artifact directories under `src/contracts/` that keep the verified ABI and
  source bundles close to the app's contract data layer

## Current Product Surface

The app currently exposes two top-level routes:

- `/`: an Explorer shell route that is present in navigation but does not yet
  contain the live observability experience
- `/architecture`: the implemented MONY Architecture Map experience

The global navigation is rendered from `src/app/navigation/`, and the entire
app runs in forced light mode through the root Chakra/`next-themes` provider.

## Architecture Map

The Architecture Map lives at `/architecture` and is backed by the contract data
layer in `src/lib/contracts/`. It turns the Diamond Proxy and facet set into a
readable product and operations reference.

### What the page shows

- A Diamond header with the MONY proxy address, EIP-2535 context, and the total
  number of discovered facets/modules
- Business-clustered module groups that map technical facets into product
  responsibilities
- A shared detail surface that opens as a desktop sidebar on `Module Map` and a
  drawer overlay everywhere else

### Current tabs

- `Module Map`: the core facet topology grouped by business responsibility
- `Permission Matrix`: registry-authored role-to-module access, split into one
  table per responsibility cluster
- `Dependencies`: authored module dependency relationships with focused
  blast-radius filtering
- `Lifecycle Flows`: operator playbooks presented as timelines, with each step
  linked back to the relevant module

### Module detail surface

Selecting a module reveals:

- business summary and operational impact
- required roles and standards/EIP references
- read methods, write methods, and emitted events derived from the ABI
- a source viewer backed by the verified source artifacts in
  `src/contracts/source/`

## Contract Data Sources

The frontend architecture page is built from checked-in contract artifacts:

- `src/contracts/abi/`: 17 ABI files for the Diamond Proxy and facet contracts
- `src/contracts/source/`: 17 verified source bundles from Etherscan, preserved
  in their wrapped Standard JSON Input shape

Supporting scripts:

- `scripts/getContracts.ts`: pulls verified contract metadata, source bundles,
  and ABI payloads into `src/contracts/source/` and `src/contracts/abi/`
- `scripts/extractSolidity.ts`: converts the verified source bundles into real
  Solidity files inside the Foundry project under `contracts/`

## Local Foundry Workspace

The repo now includes a local Foundry workspace at `contracts/` for source
inspection, compilation, and future audit or fact-checking work.

### What is in `contracts/`

- `contracts/src/`: 56 extracted MONY Solidity files covering facets,
  interfaces, and libraries
- `contracts/src/diamond-proxy/`: the isolated Solidity `0.8.17` subset for
  `FactTokenDiamond.sol`, `LibDiamond.sol`, and its proxy-only interfaces
- `contracts/lib/openzeppelin-contracts/`: vendored OpenZeppelin dependency
  pinned to `v5.0.2`
- `contracts/remappings.txt`: Foundry remappings for OpenZeppelin, ODA Platform
  import paths, and local `contracts/` source aliases

### Why the proxy lives in its own profile

The main MONY facet corpus compiles with Solidity `0.8.26`, but the Diamond
Proxy itself was deployed with Solidity `0.8.17`. Those compiler versions have
an incompatible `LibDiamond.sol`, so the workspace keeps the proxy files in a
separate `diamond-proxy` source tree and compile profile.

### Foundry profiles

- default profile: `contracts/src`, Solidity `0.8.26`, EVM target `paris`,
  skips `src/diamond-proxy`
- `diamond-proxy` profile: `contracts/src/diamond-proxy`, Solidity `0.8.17`,
  separate cache/output path for the proxy subset

## Getting Started

### Prerequisites

- Bun
- Foundry (`forge`, `cast`, `anvil`)

### Environment

Create a `.env` from `.env.example` and set:

- `NEXT_PUBLIC_PRIMARY_RPC_URL`
- `NEXT_PUBLIC_SECONDARY_RPC_URL`
- `NEXT_PUBLIC_MONY_SMART_CONTRACT_ADDRESS`
- `ETHERSCAN_API_KEY`

The checked-in example uses the MONY mainnet Diamond Proxy address:
`0x6a7c6aa2b8b8a6A891dE552bDEFFa87c3F53bD46`.

### App commands

```bash
bun install
bun dev
```

Useful verification commands:

```bash
bun lint
bun test
bun run build
bun run test:e2e:update
```

### Contract and extraction commands

Refresh verified contract artifacts:

```bash
bun scripts/getContracts.ts
```

Rebuild the local Foundry source tree from `src/contracts/source/`:

```bash
bun scripts/extractSolidity.ts
```

Compile the extracted Solidity:

```bash
cd contracts
forge build
FOUNDRY_PROFILE=diamond-proxy forge build
```

Example `cast` call for the live Diamond Proxy:

```bash
cast call -r https://eth.drpc.org \
  0x6a7c6aa2b8b8a6A891dE552bDEFFa87c3F53bD46 \
  "facetAddresses()(address[])"
```

## Repository Guide

Key directories:

- `src/app/`: Next.js App Router routes and shared layout/navigation
- `src/components/architecture/`: the Architecture Map UI and tab surfaces
- `src/lib/contracts/`: ABI parsing, metadata assembly, permission matrix, and
  lifecycle flow definitions
- `src/contracts/`: checked-in verified ABI and source artifacts
- `contracts/`: local Foundry workspace for extracted MONY Solidity
- `tests/`: Bun unit tests and Playwright end-to-end coverage

## External References

- MONY Diamond Proxy on Etherscan:
  `https://etherscan.io/address/0x6a7c6aa2b8b8a6A891dE552bDEFFa87c3F53bD46#code`
- ERC-2535 Diamonds:
  `https://eips.ethereum.org/EIPS/eip-2535`
- Foundry documentation:
  `https://book.getfoundry.sh/`
