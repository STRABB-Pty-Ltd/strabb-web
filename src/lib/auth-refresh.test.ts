import { afterEach, describe, expect, it, vi } from "vitest";

import { FatalRefreshError, refreshAccessToken } from "./auth-refresh";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function okResponse(pair: { access_token: string; refresh_token: string }): Response {
  return { ok: true, json: async () => pair } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("refreshAccessToken single-flight", () => {
  it("collapses overlapping refreshes of the same token into one request and one shared pair", async () => {
    const gate = deferred<Response>();
    const fetchMock = vi.fn(() => gate.promise);
    vi.stubGlobal("fetch", fetchMock);

    // Both fire while the first request is still unresolved (overlap).
    const first = refreshAccessToken("rt-1");
    const second = refreshAccessToken("rt-1");

    // Exactly one POST /auth/refresh for two concurrent callers, and both hold
    // the identical in-flight promise.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);

    const pair = { access_token: "at-new", refresh_token: "rt-new" };
    gate.resolve(okResponse(pair));

    await expect(first).resolves.toEqual(pair);
    await expect(second).resolves.toEqual(pair);
  });

  it("starts a fresh request once the previous one has settled (entry cleared on success)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ access_token: "a", refresh_token: "r" }));
    vi.stubGlobal("fetch", fetchMock);

    await refreshAccessToken("rt-1");
    await refreshAccessToken("rt-1");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("clears the in-flight entry after a rejection so the next call is not a poisoned cached rejection", async () => {
    const first = deferred<Response>();
    const fetchMock = vi.fn().mockReturnValueOnce(first.promise);
    vi.stubGlobal("fetch", fetchMock);

    const failing = refreshAccessToken("rt-1");
    first.reject(new Error("network blip"));
    await expect(failing).rejects.toThrow("network blip");

    // A second attempt issues a brand-new request rather than re-awaiting the
    // rejected one.
    fetchMock.mockResolvedValueOnce(okResponse({ access_token: "a2", refresh_token: "r2" }));
    await expect(refreshAccessToken("rt-1")).resolves.toEqual({
      access_token: "a2",
      refresh_token: "r2",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("refreshAccessToken error classification", () => {
  it("throws FatalRefreshError on a non-transient 4xx (dead refresh token)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 } as Response));
    await expect(refreshAccessToken("rt-fatal")).rejects.toBeInstanceOf(FatalRefreshError);
  });

  it("throws a non-fatal error on a 5xx/transient status (keep-and-retry path)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 } as Response));
    const error = await refreshAccessToken("rt-transient").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(FatalRefreshError);
  });
});
