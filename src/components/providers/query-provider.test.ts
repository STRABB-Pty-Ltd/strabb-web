import { describe, expect, it } from "vitest";

import { shouldRetryQuery } from "./query-provider";
import { ApiError } from "@/lib/api-client";

describe("shouldRetryQuery", () => {
  it("never retries a 403 (role-gated)", () => {
    expect(shouldRetryQuery(0, new ApiError(403, "Insufficient role"))).toBe(false);
    expect(shouldRetryQuery(5, new ApiError(403, "Insufficient role"))).toBe(false);
  });

  it("never retries a 401 (dead session)", () => {
    expect(shouldRetryQuery(0, new ApiError(401, "Unauthorized"))).toBe(false);
  });

  it("never retries a 402 (subscription lapsed)", () => {
    expect(shouldRetryQuery(0, new ApiError(402, "Subscription inactive"))).toBe(false);
    expect(shouldRetryQuery(5, new ApiError(402, "Subscription inactive"))).toBe(false);
  });

  it("retries a 500 exactly once (two attempts total)", () => {
    const error = new ApiError(500, "Server error");
    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(1, error)).toBe(false);
  });

  it("retries a non-ApiError (e.g. network) once", () => {
    const error = new Error("network down");
    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(1, error)).toBe(false);
  });
});
