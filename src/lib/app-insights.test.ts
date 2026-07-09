import { describe, expect, it } from "vitest";

import { initAppInsights, trackError } from "./app-insights";

// NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING is unset in the test env,
// so the SDK must stay a no-op: init returns null and reporting can't throw.
// This is what keeps local + CI (no connection string) clean.
describe("app-insights gating", () => {
  it("initAppInsights returns null when no connection string is configured", () => {
    expect(initAppInsights()).toBeNull();
  });

  it("trackError does not throw when uninitialised", () => {
    expect(() => trackError(new Error("boom"))).not.toThrow();
  });
});
