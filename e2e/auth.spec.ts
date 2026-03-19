import { expect, test } from "@playwright/test";

/**
 * Sign-in flow E2E test.
 *
 * Requires the backend running on http://localhost:8000 with the
 * placeholder credentials (test@strabb.io / testpassword).
 */

test.describe("Authentication flow", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs in with valid credentials and redirects to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill("test@strabb.io");
    await page.getByLabel(/password/i).fill("testpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Sidebar should be visible with navigation links
    await expect(page.getByText("Dashboard")).toBeVisible();
    await expect(page.getByText("Properties")).toBeVisible();
    await expect(page.getByText("Bookings")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill("wrong@email.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("can sign out and return to login", async ({ page }) => {
    // Sign in first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@strabb.io");
    await page.getByLabel(/password/i).fill("testpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Open account menu and sign out
    await page.getByLabel("Account menu").click();
    await page.getByText("Sign out").click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
