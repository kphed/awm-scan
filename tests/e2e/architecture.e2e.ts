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
    page.getByRole("tab", { name: "Shared Libraries" }),
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
  await page.getByRole("button", { name: "Redemption Intake" }).click();
  await expect(
    page.getByText(
      "Source also requires the burner_ argument to already hold the BURNER role.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Subscription Processing" }).click();

  await page.getByRole("button", { name: "Write Operations" }).click();
  const mintMethodTrigger = page
    .getByText("mint(bytes32,address,uint256)", { exact: true })
    .first();
  await expect(mintMethodTrigger).toBeVisible();
  await mintMethodTrigger.click();
  await expect(
    page.getByText(
      "Creates a request to mint tokens to the requester address",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("MUST revert if contract is paused").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open in Source Explorer" }).first(),
  ).toBeVisible();
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
  await page.getByRole("button", { name: "Role Enforcement" }).click();
  await expect(
    page.getByLabel("Role Enforcement").getByText("whenNotPaused").first(),
  ).toBeVisible();
  await expect(page.getByText("Storage Access")).toBeVisible();

  await page.getByRole("tab", { name: "Permission Matrix" }).click();
  await expect(
    page.getByText("Registry-authored caller-role view", { exact: false }),
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
  await page.getByText("Proof snippet", { exact: false }).first().click();
  await expect(
    page.getByText("LibERC20.ref()._totalSupply", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Token Status Controls" }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.getByRole("tab", { name: "Shared Libraries" }).click();
  await expect(page.getByText("LibAccessControl", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /LibAccessControl/i }).click();
  await expect(
    page.getByText("MintableFacet", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open in Source Explorer" }).first(),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Lifecycle Flows" }).click();
  await page
    .getByRole("tab", { name: "Gated Redemption (Prepare → Approve → Burn)" })
    .click();
  await expect(
    page.getByText("Request Approved", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Staged Tokens Burned", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Burn Executed", { exact: true })).toHaveCount(0);
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

test("source explorer renders file navigation and deep-linked line context", async ({
  page,
}) => {
  await page.goto("/source/facets/MintableFacet.sol?line=49-65");
  const line49 = page.locator("#line-49");

  await expect(page.getByRole("link", { name: "Source" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(
    page.getByRole("heading", { name: "MONY Source Explorer" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "MintableFacet.sol" }),
  ).toBeVisible();
  await expect(
    page.getByText("Solidity 0.8.26", { exact: false }).first(),
  ).toBeVisible();
  await expect(page.getByText("Ln 49-65", { exact: false })).toBeVisible();
  await expect(
    page.getByText("whenNotPaused", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Open on Etherscan/i }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Search source files")).toBeVisible();
  await expect(line49).toBeVisible();
  await expect
    .poll(async () => {
      return line49.evaluate((element) =>
        Math.round(element.getBoundingClientRect().top),
      );
    })
    .toBeLessThan(220);
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
  await expect(page.getByText("Unpause Queued", { exact: true })).toBeVisible();
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

  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Diamond Module Upgrade" }).click();
  await expect(page.getByText("Upgrade Prepared", { exact: true })).toBeVisible();
  await expect(page.getByText("Upgrade Proposed", { exact: true })).toHaveCount(
    0,
  );
});
