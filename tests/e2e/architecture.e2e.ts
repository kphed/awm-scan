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
  await expect(page.getByRole("tab", { name: "Module Map" })).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Permission Matrix" }),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Dependencies" })).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Lifecycle Flows" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "splits the contract's functionality across multiple modules",
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Select a module to explore its capabilities"),
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

  await page.getByRole("tab", { name: "Permission Matrix" }).click();
  await expect(
    page.getByText("Registry-authored responsibility view", { exact: false }),
  ).toBeVisible();
  await expect(page.locator("table")).toHaveCount(5);
  await expect(
    page.locator("table").nth(1).locator("thead th").nth(1),
  ).toHaveCSS("text-align", "center");
  await expect(
    page.getByText("Select a module to explore its capabilities"),
  ).toBeHidden();
  await expect(
    page
      .locator("table")
      .first()
      .getByText("TOKENIZATION_AGENT", { exact: true })
      .first(),
  ).toBeVisible();
  await page.getByLabel("Open Token Transfers details for PUBLIC").click();
  await expect(
    page.locator('[data-part="title"]', { hasText: "Token Transfers" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("tab", { name: "Dependencies" }).click();
  await page.getByRole("button", { name: /Redemption Approval/i }).click();
  await expect(
    page.getByText("Dependency relationships: Redemption Approval", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByText(
        "Approved or rejected staged burns mutate shared ERC-20 balances and supply",
        {
          exact: false,
        },
      )
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Clear dependency filter" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Token Status Controls" }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.getByRole("tab", { name: "Lifecycle Flows" }).click();
  await page
    .getByRole("tab", { name: "Gated Redemption (Prepare → Approve → Burn)" })
    .click();
  await expect(
    page.getByText("Request Approved", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("approveBurn()", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Redemption Approval" })
    .first()
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByText(
        "Approves, rejects, and inspects pending redemption requests.",
        {
          exact: true,
        },
      ),
  ).toBeVisible();

  await page.waitForTimeout(250);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("architecture page keeps the mobile drawer working from expansion tabs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/architecture");

  await page.getByRole("tab", { name: "Permission Matrix" }).click();
  await page.getByLabel("Open Token Transfers details for PUBLIC").click();
  await expect(
    page.locator('[data-part="title"]', { hasText: "Token Transfers" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByText(
        "Implements the core ERC-20 balance, transfer, and approval flows, while stop codes gate movement and burner-address transfers create pending redemption requests.",
        {
          exact: true,
        },
      ),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Lifecycle Flows" }).click();
  await page.getByRole("tab", { name: "Emergency Pause" }).click();
  await page.getByRole("button", { name: "Emergency Pause" }).first().click();
  await expect(
    page.locator('[data-part="title"]', { hasText: "Emergency Pause" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByText(
        "Pauses the fund token directly as TOKEN_ADMIN and unpauses it through the timelock execution path.",
        {
          exact: true,
        },
      ),
  ).toBeVisible();
});
