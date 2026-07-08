import { MutationObserver } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";

import {
  GENERIC_MUTATION_ERROR,
  createQueryClient,
  getErrorMessage,
  shouldRetryQuery,
} from "./query-provider";
import { ApiError } from "@/lib/api-client";
import { useAppStore } from "@/stores/app-store";

describe("shouldRetryQuery", () => {
  it("never retries a 403 (role-gated)", () => {
    expect(shouldRetryQuery(0, new ApiError(403, "Insufficient role"))).toBe(false);
    expect(shouldRetryQuery(5, new ApiError(403, "Insufficient role"))).toBe(false);
  });

  it("never retries a 401 (dead session)", () => {
    expect(shouldRetryQuery(0, new ApiError(401, "Unauthorized"))).toBe(false);
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

describe("getErrorMessage", () => {
  it("prefers the ApiError envelope message", () => {
    expect(getErrorMessage(new ApiError(422, "Check-out must be after check-in"))).toBe(
      "Check-out must be after check-in",
    );
  });

  it("falls back to a plain Error message", () => {
    expect(getErrorMessage(new Error("network down"))).toBe("network down");
  });

  it("returns the generic fallback for a message-less error", () => {
    expect(getErrorMessage(new Error(""))).toBe(GENERIC_MUTATION_ERROR);
  });

  it("returns the generic fallback for a non-Error value", () => {
    expect(getErrorMessage("boom")).toBe(GENERIC_MUTATION_ERROR);
    expect(getErrorMessage(undefined)).toBe(GENERIC_MUTATION_ERROR);
  });
});

describe("createQueryClient mutation error toast", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  async function runFailingMutation(meta?: { suppressGlobalError?: boolean }) {
    const client = createQueryClient();
    const observer = new MutationObserver(client, {
      mutationFn: async () => {
        throw new ApiError(500, "Save failed");
      },
      meta,
    });
    await observer.mutate().catch(() => {
      // The mutation is expected to reject; the assertion is on the toast.
    });
  }

  it("toasts a failed mutation by default", async () => {
    await runFailingMutation();
    const toasts = useAppStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ type: "error", message: "Save failed" });
  });

  it("stays silent when the mutation opts out via suppressGlobalError", async () => {
    await runFailingMutation({ suppressGlobalError: true });
    expect(useAppStore.getState().toasts).toHaveLength(0);
  });

  it("does not toast a successful mutation", async () => {
    const client = createQueryClient();
    const observer = new MutationObserver(client, {
      mutationFn: async () => "ok",
    });
    await observer.mutate();
    expect(useAppStore.getState().toasts).toHaveLength(0);
  });

  it("settings-style opt-out with a local error toast yields exactly one toast", async () => {
    // Regression: settings save owns its error UX (meta opt-out + bespoke
    // toast). The global handler must stay silent so the user sees ONE
    // message, not two.
    const client = createQueryClient();
    const observer = new MutationObserver(client, {
      mutationFn: async () => {
        throw new ApiError(500, "Save failed");
      },
      meta: { suppressGlobalError: true },
    });
    await observer.mutate().catch(() => {
      useAppStore.getState().addToast({ type: "error", message: "Failed to save settings" });
    });
    const toasts = useAppStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe("Failed to save settings");
  });
});
