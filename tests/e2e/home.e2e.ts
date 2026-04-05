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

  // Give the initial hydration pass a moment to surface browser-side errors.
  await page.waitForTimeout(250);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
