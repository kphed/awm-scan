import { expect, test } from "@playwright/test";

test("home page loads without runtime browser errors", async ({ page }) => {
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

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Explorer" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Architecture" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Source" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Protocol Activity" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByText("On-chain events emitted by the MONY Diamond proxy", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Token Operations", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Transfer", { exact: true }).first()).toBeVisible();

  await page.getByText("Transfer", { exact: true }).first().click();
  await expect(
    page.getByRole("link", { name: "Subscription Processing" }).first(),
  ).toBeVisible();

  // Give the initial hydration pass a moment to surface browser-side errors.
  await page.waitForTimeout(250);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("explorer events cross-link to architecture and source context", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("button", { name: /Transfer Token Operations/i })
    .first()
    .click();

  await page.getByRole("link", { name: "Subscription Processing" }).first().click();
  await expect(page).toHaveURL(/\/architecture\?module=MintableFacet/);
  await expect(
    page.getByRole("heading", { name: "Subscription Processing" }).first(),
  ).toBeVisible();

  await page.goto("/");
  await page
    .getByRole("button", { name: /Transfer Token Operations/i })
    .first()
    .click();
  await page.getByRole("link", { name: /\.sol$/ }).first().click();
  await expect(page).toHaveURL(/\/source\//);
  await expect(
    page.getByRole("heading", { name: "MONY Source Explorer" }),
  ).toBeVisible();
});
