import { expect, test } from "@playwright/test";

import { CORE_PAGES } from "./core-pages";
import { loginAsDemoUser } from "./helpers";

// Split out from viewport-regression.spec.ts so this only runs on the
// desktop-1280 project. Putting it in the same file as an in-body
// test.skip() meant tablet-768/mobile-375 still ran beforeEach (a full
// login) before reaching the skip - wasted logins that also ate into the
// dev server's on-demand compile budget. A separate file naturally stays
// out of the other two projects' testMatch in playwright.config.ts.
test.describe("Viewport regression matrix - desktop baseline", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  // Pixel baseline locked from current main (post-G.1) as the reference
  // point every later phase PR (G.2-G.6b) diffs against, so a mobile-
  // focused change can't silently reflow the desktop layout. Only the
  // desktop size gets a pixel baseline: 375/768 layouts are expected to
  // change throughout the phase, so there's no stable baseline for them
  // yet - the scrollWidth check in viewport-regression.spec.ts is their
  // regression gate instead.
  for (const { path, name } of CORE_PAGES) {
    test(`${name}: desktop layout unchanged`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${name}-1280.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});
