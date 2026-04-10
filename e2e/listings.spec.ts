import { expect, test } from "@playwright/test";

import { loginAsDemoUser } from "./helpers";

test.describe("Listing management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test("navigates to listings page and sees listing list", async ({ page }) => {
    await page.getByRole("link", { name: "Listings" }).click();
    await expect(page).toHaveURL(/\/listings/);
    await expect(page.getByText("Listings")).toBeVisible();
    await expect(page.getByRole("button", { name: /add listing/i })).toBeVisible();
  });

  test("opens create listing dialog with property dropdown", async ({ page }) => {
    await page.getByRole("link", { name: "Listings" }).click();
    await page.getByRole("button", { name: /add listing/i }).click();

    await expect(page.getByText("Add Listing")).toBeVisible();
    await expect(page.getByLabel(/property/i)).toBeVisible();
    await expect(page.getByLabel(/platform/i)).toBeVisible();
  });

  test("sync button is visible", async ({ page }) => {
    await page.getByRole("link", { name: "Listings" }).click();
    await expect(page.getByRole("button", { name: /sync now/i })).toBeVisible();
  });
});
