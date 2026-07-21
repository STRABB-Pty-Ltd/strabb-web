import { chromium, expect } from "@playwright/test";

import { CORE_PAGES } from "./core-pages";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

// next dev compiles each route on first hit, which can take long enough to
// make anything else happening at that moment (e.g. a login callback in a
// different test) look flaky - not a real bug, just cold-start cost landing
// on whichever test happens to be running when a route is hit for the first
// time. Hitting every route once here, before any project starts asserting,
// moves that cost out of the timed/asserted part of the run. webServer's
// `url` check only confirms the server process is up, not that any given
// route is compiled - so this first login is the single coldest request of
// the whole run (page bundle + the separate auth API route + middleware,
// all compiling for the first time together) and gets a much longer
// timeout than loginAsDemoUser's 10s, which is sized for the warmed-up
// state every other test runs in after this.
export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: "http://localhost:3100" });
  await page.goto("/login", { timeout: 60000 });
  await page.getByLabel(/email/i).fill(DEMO_EMAIL);
  await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60000 });
  for (const { path } of CORE_PAGES) {
    await page.goto(path, { waitUntil: "networkidle", timeout: 60000 });
  }
  await browser.close();
}
