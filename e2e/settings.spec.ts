import { expect, test } from "@playwright/test";

import { loginAsDemoUser } from "./helpers";

test.describe("Settings and admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test("settings page shows subscription status", async ({ page }) => {
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByText(/subscription/i)).toBeVisible({ timeout: 5000 });
  });

  test("admin health page displays system stats", async ({ page }) => {
    await page.goto("/settings/admin");
    await expect(page.getByText(/system health/i)).toBeVisible({ timeout: 5000 });
  });

  test("legal pages are accessible", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByText(/privacy/i)).toBeVisible();

    await page.goto("/terms");
    await expect(page.getByText(/terms/i)).toBeVisible();
  });
});
