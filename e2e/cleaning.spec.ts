import { expect, test } from "@playwright/test";

test.describe("Cleaning tasks", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  // Cleaning tasks live under Operations, behind the "Cleaning" submenu chip.
  test("navigates to cleaning tasks page", async ({ page }) => {
    await page.getByRole("link", { name: "Operations" }).click();
    await expect(page).toHaveURL(/\/operations/, { timeout: 15000 });

    const cleaningChip = page.getByRole("button", { name: "Cleaning", exact: true });
    await cleaningChip.click();
    await expect(cleaningChip).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "Cleaning" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tickets" })).toHaveCount(0);
  });
});
