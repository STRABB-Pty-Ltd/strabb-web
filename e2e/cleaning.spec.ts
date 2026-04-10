import { expect, test } from "@playwright/test";

import { loginAsDemoUser } from "./helpers";

test.describe("Cleaning tasks", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test("navigates to cleaning tasks page", async ({ page }) => {
    await page.getByRole("link", { name: "Automations" }).click();
    await page.getByRole("link", { name: /cleaning/i }).click();
    await expect(page).toHaveURL(/\/automations\/cleaning/);
    await expect(page.getByText(/cleaning/i)).toBeVisible();
  });
});
