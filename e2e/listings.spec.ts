import { expect, test } from "@playwright/test";

test.describe("Listing management", () => {
  test.beforeEach(async ({ page }) => {
    // Listings moved under Settings (its own route, /settings/listings).
    await page.goto("/settings/listings");
  });

  test("navigates to listings page and sees listing list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Listings", level: 2 })).toBeVisible();
    await expect(page.locator("main [aria-expanded]").first()).toBeVisible();
  });

  test("sync button is visible", async ({ page }) => {
    await page.locator("main [aria-expanded]").first().click();
    await page.getByRole("tab", { name: "Channex" }).click();
    await expect(page.getByRole("button", { name: /force full sync now/i })).toBeVisible();
  });
});
