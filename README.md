# awm-scan

AWM Scan is a Next.js app for inspecting the JPM MONY protocol through a
product and operations lens. The repo combines:

- a Chakra UI frontend for the Architecture Map and Source Explorer
- a local Foundry workspace under `contracts/` with the extracted MONY
  Solidity corpus
- checked-in ABI, source, source-metadata, and event-snapshot artifacts under
  `src/contracts/`

## Current Product Surface

The app currently exposes three user-facing surfaces:

- `/`: an Explorer shell route. The event-indexing pipeline exists and publishes
  a snapshot artifact, but the live explorer UI has not been built yet.
- `/architecture`: the Architecture Map, which turns the Diamond Proxy and
  facets into a readable module map, role matrix, dependency view, and operator
  playbook.
- `/source`: a read-only IDE for the extracted MONY Solidity source tree.
  Dynamic file routes also exist at `/source/[...filePath]`, with optional line
  deep links like `/source/facets/MintableFacet.sol?line=49-65`.

The global navigation lives in `src/app/navigation/`, and the app currently
forces light mode through the root Chakra/`next-themes` provider stack.

## Architecture Map

The Architecture Map lives at `/architecture` and is assembled from the
contract data layer in `src/lib/contracts/`.

### What the page shows

- a Diamond header with the MONY proxy address, EIP-2535 context, and total
  discovered module count
- business-clustered module groups that translate technical facets into product
  responsibilities
- a shared detail surface that opens as a desktop sidebar on `Module Map` and a
  drawer overlay everywhere else

### Current tabs

- `Module Map`: the core facet topology grouped by business responsibility
- `Permission Matrix`: registry-authored caller-role access, split into one
  table per responsibility cluster
- `Dependencies`: authored module dependency relationships with focused
  blast-radius filtering and source-backed proof snippets
- `Shared Libraries`: cross-reference view for shared Solidity libraries and
  the facets that rely on them
- `Lifecycle Flows`: operator playbooks presented as timelines, with each step
  linked back to the relevant module

### Module detail surface

Selecting a module reveals:

- business summary, operational impact, required roles, and standards/EIP
  references
- read methods and write methods parsed from the ABI
- authored method descriptions plus extracted NatSpec, parameter notes, return
  metadata, and source-backed code previews
- modifier chains and storage-access summaries derived from the extracted
  Solidity
- emitted events from the ABI
- a related-source-file viewer with direct deep links into the `/source` route

## Source Explorer

The Source Explorer lives at `/source` and is a read-only IDE for the extracted
MONY smart contracts. It is backed by generated metadata in
`src/contracts/source-metadata/`, which is built from the Solidity tree under
`contracts/src/`.

### What the Source Explorer supports

- nested file-tree navigation across facets, libraries, interfaces, and the
  isolated `diamond-proxy` subset
- search by file path or Solidity content
- syntax-highlighted code with line numbers and compiler metadata badges
- line-range deep links via `?line=start-end`, including automatic scroll to
  the first highlighted line
- import and reverse-import (`Referenced by`) panels for the selected file
- owner metadata that maps source files back to Architecture Map modules when a
  module owns the file
- direct Etherscan link-outs when the selected source file belongs to a known
  on-chain module

## Contract Artifacts And Generated Data

The frontend is driven by checked-in contract artifacts and generated metadata:

- `src/contracts/abi/`: verified ABI payloads for the Diamond Proxy and facet
  contracts
- `src/contracts/source/`: verified Etherscan source bundles in wrapped
  Standard JSON Input form
- `src/contracts/source-metadata/`: generated source explorer data, including
  file trees, import graphs, syntax-highlighted files, method bodies, NatSpec,
  modifier chains, dependency proofs, library cross-references, and storage
  access
- `src/contracts/events/`: indexed event snapshot artifacts (`snapshot.json`
  and `cursor.json`) for the future Explorer surface
- `public/events/snapshot.json`: public copy of the event snapshot served to
  the app/runtime

Supporting scripts:

- `scripts/getContracts.ts`: refreshes verified contract metadata, source
  bundles, and ABI payloads
- `scripts/extractSolidity.ts`: converts the verified source bundles into real
  Solidity files inside `contracts/`
- `scripts/extractSourceMetadata.ts`: parses the extracted Solidity tree and
  writes `src/contracts/source-metadata/`
- `scripts/indexEvents.ts`: indexes MONY contract events into
  `src/contracts/events/snapshot.json`
- `scripts/copyEventSnapshot.ts`: copies the event snapshot into
  `public/events/snapshot.json`

`bun run build` currently runs the source-metadata extraction and event
snapshot pipeline before `next build`.

## Local Foundry Workspace

The repo includes a local Foundry workspace at `contracts/` for source
inspection, compilation, and future audit or fact-checking work.

### What is in `contracts/`

- `contracts/src/`: extracted MONY Solidity files for facets, interfaces, and
  libraries
- `contracts/src/diamond-proxy/`: the isolated Solidity `0.8.17` subset for
  `FactTokenDiamond.sol`, `LibDiamond.sol`, and proxy-only interfaces
- `contracts/lib/openzeppelin-contracts/`: vendored OpenZeppelin dependency
  pinned to `v5.0.2`
- `contracts/remappings.txt`: Foundry remappings for OpenZeppelin, ODA
  Platform import paths, and local source aliases

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

Useful artifact-generation commands:

```bash
bun run contracts:source-metadata
bun run index:events
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
- `src/components/source-explorer/`: the read-only Source Explorer UI
- `src/lib/contracts/`: ABI parsing, metadata assembly, source explorer data,
  permission matrix, lifecycle flows, and event helpers
- `src/contracts/`: checked-in verified ABI/source artifacts, generated
  source-metadata, and event snapshots
- `contracts/`: local Foundry workspace for extracted MONY Solidity
- `tests/`: Bun unit tests and Playwright end-to-end coverage

## External References

- MONY Diamond Proxy on Etherscan:
  `https://etherscan.io/address/0x6a7c6aa2b8b8a6A891dE552bDEFFa87c3F53bD46#code`
- ERC-2535 Diamonds:
  `https://eips.ethereum.org/EIPS/eip-2535`
- Foundry documentation:
  `https://book.getfoundry.sh/`
