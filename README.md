# awm-scan

AWM (Asset Wealth Management) Scan is a dedicated JPM MONY explorer designed to accelerate AWM team comprehension, increase decision velocity, and establish product-owned visibility over the protocol.

## Resources

- MONY smart contract (Diamond Proxy): `https://etherscan.io/address/0x6a7c6aa2b8b8a6A891dE552bDEFFa87c3F53bD46#code`.
- ERC-2535: Diamonds, Multi-Facet Proxy: `https://eips.ethereum.org/EIPS/eip-2535`.

## Tools

- Foundry cast: A CLI tool for interacting with the EVM: `https://www.getfoundry.sh/reference/cast/cast`.

Example usage of the `cast` tool for retrieving the MONY facet addresses:
```
cast call -r https://eth.drpc.org 0x6a7c6aa2b8b8a6A891dE552bDEFFa87c3F53bD46 "facetAddresses()(address[])"
```

## App Features

* **MONY Architecture Map:** A visual topology of MONY's smart contracts (the Diamond proxy and its underlying facets). It untangles the protocol's architecture to provide immediate clarity on module relationships, administrative permissions, and emitted events. The Architecture Map also includes a sidebar, a plain-English demystifier, that translates complex on-chain modules into tangible business capabilities. This layer bridges the gap between engineering and product by outlining exactly what each facet enables, the operational constraints it imposes, and the governance mechanisms required for future modifications.
* **Live Protocol Observability:** A real-time telemetry feed indexing mainnet events. This layer moves beyond static documentation to surface live transfers, mints, burns, and administrative actions, directly linking the theoretical protocol architecture to its live on-chain execution.
