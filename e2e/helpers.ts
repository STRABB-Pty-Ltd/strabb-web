import { type Page, expect } from "@playwright/test";

// Seeded by strabb-api scripts/seed.py (owner of Chanel's demo tenant).
export const DEMO_EMAIL = "chanel@strabb.io";
export const DEMO_PASSWORD = "chanel1234";

// Session saved by auth.setup.ts and reused by every authenticated spec.
export const STORAGE_STATE = "e2e/.auth/user.json";

/**
 * Open /login and wait for React to hydrate the form. Filling before
 * hydration lets the click fall through to a native GET submit, which
 * reloads /login with empty fields (most visible on a cold dev server).
 */
export async function gotoHydratedLogin(page: Page) {
  await page.goto("/login");
  await page.waitForFunction(() => {
    const form = document.querySelector("form");
    return !!form && Object.keys(form).some((key) => key.startsWith("__reactProps"));
  });
}

/**
 * Log in as the demo user and wait for the dashboard to load.
 */
export async function loginAsDemoUser(page: Page) {
  await gotoHydratedLogin(page);
  await page.getByLabel(/email/i).fill(DEMO_EMAIL);
  await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}
