import { expect, test } from "@playwright/test";

import { loginAsDemoUser } from "./helpers";

test.describe("Booking management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test("navigates to bookings page and sees booking list", async ({ page }) => {
    await page.getByRole("link", { name: "Bookings" }).click();
    await expect(page).toHaveURL(/\/bookings/);
    await expect(page.getByText("Bookings")).toBeVisible();
  });

  test("dashboard shows booking summary", async ({ page }) => {
    // Dashboard should show booking count
    await expect(page.getByText(/total bookings/i)).toBeVisible({ timeout: 5000 });
  });
});
