import { expect, test } from "@playwright/test";

test.describe("Booking management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  // Bookings moved into the Calendar page (/bookings redirects there).
  test("navigates to the calendar to see bookings", async ({ page }) => {
    await page.getByRole("link", { name: "Calendar" }).click();
    await expect(page).toHaveURL(/\/calendar/, { timeout: 15000 });
  });

  test("dashboard shows upcoming bookings", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Upcoming Bookings" })).toBeVisible({
      timeout: 5000,
    });
  });
});
