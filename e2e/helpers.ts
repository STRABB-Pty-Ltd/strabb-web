import { type Page, expect } from "@playwright/test";

export const DEMO_EMAIL = "demo@strabb.io";
export const DEMO_PASSWORD = "demo1234";

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
