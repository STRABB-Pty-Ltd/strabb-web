import { describe, expect, it, vi } from "vitest";

import { REFRESH_TOKEN_ERROR } from "@/lib/auth-constants";

// Unwrap the next-auth `auth()` HOC so we can call the raw handler directly with
// a synthetic request. The handler only touches req.auth and req.nextUrl.
vi.mock("@/lib/auth", () => ({ auth: (handler: unknown) => handler }));

import middleware from "./middleware";

type Handler = (req: {
  auth: Record<string, unknown> | null;
  nextUrl: URL;
}) => Response | undefined;

const run = middleware as unknown as Handler;

function req(pathname: string, auth: Record<string, unknown> | null) {
  return { auth, nextUrl: new URL(`http://localhost:3000${pathname}`) };
}

function location(res: Response | undefined): string | null {
  return res?.headers.get("location") ?? null;
}

describe("middleware role-aware routing", () => {
  const OWNER_ADMIN_PREFIXES = ["/dashboard", "/reporting", "/settings"];

  it.each(OWNER_ADMIN_PREFIXES)("bounces a cleaner off %s to /operations", (prefix) => {
    const res = run(req(prefix, { role: "cleaner" }));
    expect(location(res)).toBe("http://localhost:3000/operations");
  });

  it.each(OWNER_ADMIN_PREFIXES)("lets an owner through %s (no redirect)", (prefix) => {
    expect(run(req(prefix, { role: "owner" }))).toBeUndefined();
  });

  it.each(OWNER_ADMIN_PREFIXES)("lets an admin through %s (no redirect)", (prefix) => {
    expect(run(req(prefix, { role: "admin" }))).toBeUndefined();
  });

  it("lets a cleaner through its own pages (/operations, /calendar)", () => {
    expect(run(req("/operations", { role: "cleaner" }))).toBeUndefined();
    expect(run(req("/calendar", { role: "cleaner" }))).toBeUndefined();
  });

  it("sends a cleaner from root to /operations and an owner to /dashboard", () => {
    expect(location(run(req("/", { role: "cleaner" })))).toBe("http://localhost:3000/operations");
    expect(location(run(req("/", { role: "owner" })))).toBe("http://localhost:3000/dashboard");
  });

  it("redirects an authenticated cleaner off /login to /operations, owner to /dashboard", () => {
    expect(location(run(req("/login", { role: "cleaner" })))).toBe(
      "http://localhost:3000/operations",
    );
    expect(location(run(req("/login", { role: "owner" })))).toBe("http://localhost:3000/dashboard");
  });

  it("redirects an unauthenticated request to /login with a callbackUrl", () => {
    const res = run(req("/dashboard", null));
    const loc = location(res);
    expect(loc).toContain("/login");
    expect(loc).toContain("callbackUrl=%2Fdashboard");
  });

  it("treats a refresh-token-error session as unauthenticated", () => {
    const res = run(req("/calendar", { role: "owner", error: REFRESH_TOKEN_ERROR }));
    expect(location(res)).toContain("/login");
  });

  // C.5: the emailed auth links must reach an unauthenticated visitor, so the
  // public allowlist has to let them straight through (no bounce to /login).
  const PUBLIC_AUTH_ROUTES = ["/forgot-password", "/reset-password/abc123", "/invite/xyz789"];

  it.each(PUBLIC_AUTH_ROUTES)(
    "lets an unauthenticated visitor reach %s without redirecting to login",
    (path) => {
      expect(run(req(path, null))).toBeUndefined();
    },
  );

  it("does not treat a lookalike path as public (/reset-password without a token still bounces)", () => {
    // The allowlist prefix is "/reset-password/" with a trailing slash, so the
    // bare "/reset-password" (no token) is NOT public and an unauthenticated hit
    // is sent to login - proving the guard is a prefix match, not a substring.
    const res = run(req("/reset-password", null));
    expect(location(res)).toContain("/login");
  });
});
