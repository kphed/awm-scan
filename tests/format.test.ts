import { describe, expect, test } from "bun:test";
import { eipToUrl, truncateAddress } from "../src/lib/format";

describe("format helpers", () => {
  test("truncates Ethereum addresses for UI display", () => {
    expect(truncateAddress("0x6a7c6aa2b8b8a6A891dE552bDEFFa87c3F53bD46")).toBe(
      "0x6a7c...bD46",
    );
  });

  test("maps EIP labels to their official specification URLs", () => {
    expect(eipToUrl("EIP-2535")).toBe(
      "https://eips.ethereum.org/EIPS/eip-2535",
    );
    expect(eipToUrl("Custom (OpenZeppelin-inspired timelock)")).toBeNull();
  });
});
