import { expect, test } from "@playwright/test";

test("architecture page renders progressive disclosure without browser errors", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/architecture");

  await expect(
    page.getByRole("link", { name: "Architecture" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByText("MONY Fund Token", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Diamond Proxy", { exact: true })).toBeVisible();
  await expect(page.getByText("Subscriptions & Redemptions")).toBeVisible();
  await expect(page.getByText("Subscription Processing")).toBeVisible();
  await expect(
    page.getByText(
      "splits the contract's functionality across multiple modules",
    ),
  ).toBeVisible();
  await expect(page.getByText("mint(bytes32,address,uint256)")).toHaveCount(0);

  await page.getByRole("button", { name: "Subscription Processing" }).click();

  await expect(
    page.getByText(
      "Creates MONY fund tokens when new subscription capital is accepted.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /0xe70c/i })).toBeVisible();
  await expect(page.getByText("Metadata Missing")).toHaveCount(0);

  await page.getByRole("button", { name: "Write Operations" }).click();
  await expect(
    page.getByText("mint(bytes32,address,uint256)", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("mint(bytes32,address,uint256)", { exact: true })
    .click();
  await expect(
    page.getByText(
      "Creates new fund tokens for an investor after subscription capital clears.",
    ),
  ).toBeVisible();
  await expect(page.getByText("bytes32").first()).toBeVisible();
  await page.getByRole("button", { name: "Emitted Events" }).click();
  await page
    .getByText("Mint(bytes32,address,address,uint256)", { exact: true })
    .click();
  await expect(
    page.getByText("No description available.").first(),
  ).toBeVisible();

  await page.waitForTimeout(250);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
