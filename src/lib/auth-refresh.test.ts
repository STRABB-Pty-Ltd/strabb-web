import { afterEach, describe, expect, it, vi } from "vitest";

import { FatalRefreshError, refreshAccessToken } from "./auth-refresh";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const tokenPair = (accessToken: string, refreshToken: string) => ({
  access_token: accessToken,
  refresh_token: refreshToken,
  token_type: "bearer",
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("refreshAccessToken - single-flight dedupe", () => {
  it("collapses two concurrent calls for the same token into one fetch", async () => {
    const gate = deferred<Response>();
    const fetchMock = vi.fn().mockReturnValue(gate.promise);
    vi.stubGlobal("fetch", fetchMock);

    // Fire the second call before the first has resolved, so the overlap is
    // real rather than incidental - a test where the first call already
    // settled before the second fired would prove nothing about dedupe.
    const first = refreshAccessToken("refresh-1");
    const second = refreshAccessToken("refresh-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);

    gate.resolve(mockResponse(tokenPair("new-access", "new-refresh")));

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(secondResult);
    expect(firstResult.access_token).toBe("new-access");
  });

  it("issues a separate fetch per distinct refresh token", async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      const { refresh_token } = JSON.parse(init.body as string);
      return Promise.resolve(mockResponse(tokenPair(`access-for-${refresh_token}`, "rotated")));
    });
    vi.stubGlobal("fetch", fetchMock);

    const [a, b] = await Promise.all([
      refreshAccessToken("token-a"),
      refreshAccessToken("token-b"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(a.access_token).toBe("access-for-token-a");
    expect(b.access_token).toBe("access-for-token-b");
  });

  it("propagates a fatal rejection to every concurrent caller", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({}, 401));
    vi.stubGlobal("fetch", fetchMock);

    const first = refreshAccessToken("refresh-1");
    const second = refreshAccessToken("refresh-1");

    await expect(first).rejects.toThrow(FatalRefreshError);
    await expect(second).rejects.toThrow(FatalRefreshError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("clears the in-flight entry on failure so the next call is a fresh attempt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse({}, 401))
      .mockResolvedValueOnce(mockResponse(tokenPair("new-access", "new-refresh")));
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshAccessToken("refresh-1")).rejects.toThrow(FatalRefreshError);

    // If the failed attempt's rejected promise were still cached, this would
    // resolve to the same rejection instead of making a fresh call.
    const result = await refreshAccessToken("refresh-1");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.access_token).toBe("new-access");
  });

  it("clears the in-flight entry on success so a later refresh is a fresh call", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(tokenPair("access-1", "refresh-2")))
      .mockResolvedValueOnce(mockResponse(tokenPair("access-2", "refresh-3")));
    vi.stubGlobal("fetch", fetchMock);

    const first = await refreshAccessToken("refresh-1");
    const second = await refreshAccessToken("refresh-2");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(first.access_token).toBe("access-1");
    expect(second.access_token).toBe("access-2");
  });
});
