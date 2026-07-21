import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  // Pre-hits every core route once so next dev's on-demand compilation
  // happens before any project starts asserting - see global-setup.ts.
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    // Runs every spec, including both viewport-regression*.spec.ts files -
    // the desktop-baseline one only matches here, so it never runs against
    // tablet/mobile.
    {
      name: "desktop-1280",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
    // Only the viewport matrix runs here - existing functional specs
    // (auth, bookings, etc.) don't assert anything viewport-specific, so
    // running them 3x per size would just triple runtime for no signal.
    {
      name: "tablet-768",
      testMatch: /viewport-regression\.spec\.ts/,
      use: { browserName: "chromium", viewport: { width: 768, height: 1024 } },
    },
    {
      name: "mobile-375",
      testMatch: /viewport-regression\.spec\.ts/,
      use: { browserName: "chromium", viewport: { width: 375, height: 812 } },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
  },
});
