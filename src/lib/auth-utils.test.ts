import { describe, expect, it } from "vitest";

import { decodeJwtPayload, isTokenExpiringSoon } from "./auth-utils";

// A real-ish JWT structure (header.payload.signature) with base64url-encoded payload
function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${header}.${body}.fake-signature`;
}

describe("decodeJwtPayload", () => {
  it("decodes a valid JWT payload", () => {
    const token = makeJwt({
      sub: "user-123",
      tenant_id: "tenant-456",
      token_type: "access",
      exp: 1700000000,
      iat: 1699996400,
    });

    const payload = decodeJwtPayload(token);
    expect(payload.sub).toBe("user-123");
    expect(payload.tenant_id).toBe("tenant-456");
    expect(payload.token_type).toBe("access");
    expect(payload.exp).toBe(1700000000);
  });

  it("throws on malformed token (wrong number of segments)", () => {
    expect(() => decodeJwtPayload("not-a-jwt")).toThrow("Invalid JWT");
    expect(() => decodeJwtPayload("a.b")).toThrow("Invalid JWT");
    expect(() => decodeJwtPayload("")).toThrow("Invalid JWT");
  });

  it("handles base64url characters (- and _)", () => {
    // Create payload that would produce + and / in standard base64
    const token = makeJwt({
      sub: "abc+def/ghi==",
      tenant_id: "t",
      token_type: "access",
      exp: 0,
      iat: 0,
    });

    const payload = decodeJwtPayload(token);
    expect(payload.sub).toBe("abc+def/ghi==");
  });
});

describe("isTokenExpiringSoon", () => {
  it("returns true when token is past expiry", () => {
    const pastExp = Math.floor(Date.now() / 1000) - 100;
    expect(isTokenExpiringSoon(pastExp)).toBe(true);
  });

  it("returns true when within buffer window", () => {
    const soonExp = Math.floor(Date.now() / 1000) + 30; // 30s from now
    expect(isTokenExpiringSoon(soonExp, 60)).toBe(true);
  });

  it("returns false when token has plenty of time", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1hr from now
    expect(isTokenExpiringSoon(futureExp, 60)).toBe(false);
  });
});
