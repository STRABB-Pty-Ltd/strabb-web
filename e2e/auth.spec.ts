import { expect, test } from "@playwright/test";

// The generic demo@strabb.io account was retired by feat/seed-per-person-
// tenants (PR #100) - each team member now gets their own mirrored tenant.
const DEMO_EMAIL = "chanel@strabb.io";
const DEMO_PASSWORD = "chanel1234";

test.describe("Authentication flow", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs in with valid credentials and redirects to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill(DEMO_EMAIL);
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

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
