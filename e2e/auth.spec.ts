import { expect, test } from "@playwright/test";

import { DEMO_EMAIL, DEMO_PASSWORD, gotoHydratedLogin } from "./helpers";

test.describe("Authentication flow", () => {
  // These tests exercise login itself, so start without the shared session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs in with valid credentials and redirects to dashboard", async ({ page }) => {
    await gotoHydratedLogin(page);

    await page.getByLabel(/email/i).fill(DEMO_EMAIL);
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeAttached();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await gotoHydratedLogin(page);

    await page.getByLabel(/email/i).fill("wrong@email.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("login page links to legal pages", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /privacy/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /terms/i })).toBeVisible();
  });
});
