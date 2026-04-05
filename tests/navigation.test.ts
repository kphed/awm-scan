import { describe, expect, test } from "bun:test";
import { isCurrentPath } from "../src/app/navigation/navbar-links";

describe("navigation route matching", () => {
  test("matches the root route exactly", () => {
    expect(isCurrentPath("/", "/")).toBe(true);
    expect(isCurrentPath("/architecture", "/")).toBe(false);
  });

  test("matches nested routes under non-root paths", () => {
    expect(isCurrentPath("/architecture", "/architecture")).toBe(true);
    expect(isCurrentPath("/architecture/details", "/architecture")).toBe(true);
    expect(isCurrentPath("/explorer", "/architecture")).toBe(false);
  });
});
