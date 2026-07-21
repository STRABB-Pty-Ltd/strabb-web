import { type Page, expect } from "@playwright/test";

// The generic demo@strabb.io account was retired by feat/seed-per-person-
// tenants (PR #100) - each team member now gets their own mirrored tenant
// (identical listings/bookings/tasks/conversations) instead.
export const DEMO_EMAIL = "chanel@strabb.io";
export const DEMO_PASSWORD = "chanel1234";

/**
 * Log in as the demo user and wait for the dashboard to load.
 */
export async function loginAsDemoUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(DEMO_EMAIL);
  await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}
