import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiClient } from "./api-client";

// Minimal stand-in for the fetch Response surface api-client touches
// (jsdom provides no Response constructor).
function stubFetch(opts: { status: number; statusText?: string; body?: string }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: opts.status >= 200 && opts.status < 300,
      status: opts.status,
      statusText: opts.statusText ?? "",
      json: async () => JSON.parse(opts.body ?? ""),
      text: async () => opts.body ?? "",
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiClient response handling", () => {
  it("resolves undefined for 204 No Content", async () => {
    stubFetch({ status: 204 });
    await expect(apiClient.delete("/things/1")).resolves.toBeUndefined();
  });

  it("resolves undefined for an empty 200 body", async () => {
    stubFetch({ status: 200, body: "" });
    await expect(apiClient.get("/things")).resolves.toBeUndefined();
  });

  it("resolves undefined for a whitespace-only 200 body", async () => {
    stubFetch({ status: 200, body: " \n\t " });
    await expect(apiClient.get("/things")).resolves.toBeUndefined();
  });

  it("parses a JSON body and camel-cases keys", async () => {
    stubFetch({ status: 200, body: JSON.stringify({ guest_name: "Ada", total_amount: 2 }) });
    await expect(apiClient.get("/things")).resolves.toEqual({
      guestName: "Ada",
      totalAmount: 2,
    });
  });

  it("throws ApiError carrying the backend envelope's message and code", async () => {
    stubFetch({
      status: 403,
      statusText: "Forbidden",
      body: JSON.stringify({ error: { message: "No access", code: "forbidden" } }),
    });
    const err = await apiClient.get("/things").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(403);
    expect((err as ApiError).message).toBe("No access");
    expect((err as ApiError).code).toBe("forbidden");
  });

  it("throws ApiError with the status text when the error body is not JSON", async () => {
    stubFetch({ status: 502, statusText: "Bad Gateway", body: "<html>nope</html>" });
    const err = await apiClient.get("/things").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(502);
    expect((err as ApiError).message).toBe("API error: Bad Gateway");
  });
});
