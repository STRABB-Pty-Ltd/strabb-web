import { expect, test } from "@playwright/test";

import { CORE_PAGES } from "./core-pages";
import { loginAsDemoUser } from "./helpers";

test.describe("Viewport regression matrix", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  // Runs at all three projects (375/768/1280). This is the hard,
  // OS-independent gate for "usable" per the phase's own definition - no
  // horizontal scroll at 375px, checked at every size so a page that only
  // overflows at 768 doesn't slip through.
  for (const { path, name } of CORE_PAGES) {
    test(`${name}: no horizontal scroll`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(
        scrollWidth,
        `${name} at ${clientWidth}px viewport has scrollWidth ${scrollWidth} - page overflows horizontally`,
      ).toBeLessThanOrEqual(clientWidth);
    });
  }
});
