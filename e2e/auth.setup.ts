import { test as setup } from "@playwright/test";

import { STORAGE_STATE, loginAsDemoUser } from "./helpers";

setup("log in as the demo user", async ({ page }) => {
  await loginAsDemoUser(page);
  await page.context().storageState({ path: STORAGE_STATE });
});
