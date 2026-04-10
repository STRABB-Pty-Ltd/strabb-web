import { expect, test } from "@playwright/test";

import { loginAsDemoUser } from "./helpers";

test.describe("Property management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test("navigates to properties page and sees property list", async ({ page }) => {
    await page.getByRole("link", { name: "Properties" }).click();
    await expect(page).toHaveURL(/\/properties/);
    await expect(page.getByText("Properties")).toBeVisible();
    await expect(page.getByRole("button", { name: /add property/i })).toBeVisible();
  });

  test("opens create property dialog", async ({ page }) => {
    await page.getByRole("link", { name: "Properties" }).click();
    await page.getByRole("button", { name: /add property/i }).click();

    await expect(page.getByText("Add Property")).toBeVisible();
    await expect(page.getByLabel("Name *")).toBeVisible();
    await expect(page.getByLabel(/address/i)).toBeVisible();
    await expect(page.getByLabel(/timezone/i)).toBeVisible();
  });

  test("creates a new property", async ({ page }) => {
    await page.getByRole("link", { name: "Properties" }).click();
    await page.getByRole("button", { name: /add property/i }).click();

    await page.getByLabel("Name *").fill("E2E Test Property");
    await page.getByLabel(/address/i).fill("42 Test St, Sydney NSW");

    await page.getByRole("button", { name: /add property$/i }).click();

    // Dialog should close and property should appear in list
    await expect(page.getByText("E2E Test Property")).toBeVisible({ timeout: 5000 });
  });
});
