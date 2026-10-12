import { expect, test } from "@playwright/test";

test.describe("Settings and admin", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("settings page shows subscription status", async ({ page }) => {
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings/, { timeout: 15000 });
    await page.getByRole("button", { name: "Billing", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible({ timeout: 5000 });
  });

  // System health moved from /settings/admin onto the main settings page.
  test("settings page displays system health", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /system health/i })).toBeVisible({
      timeout: 5000,
    });
  });

  // One page per test: on a cold dev server each first visit compiles the
  // route, and two compiles in one test can outrun the 30s test timeout.
  test("privacy page is accessible", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible();
  });

  test("terms page is accessible", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/terms/i);
  });
});
