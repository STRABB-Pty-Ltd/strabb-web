import { auth } from "@/lib/auth";
import { REFRESH_TOKEN_ERROR } from "@/lib/auth-constants";

// No client-side admin routes currently - admin endpoints are gated by the
// backend, and the System Health UI lives inside the General settings section
// (which hides itself for non-admin roles via the underlying API 403s).
const ADMIN_ROUTE_PREFIXES: string[] = [];

// Financial/owner surfaces: only `owner` and `admin` may reach these; a cleaner
// is bounced to their portal. This is UX + deep-link protection ONLY - the API
// role matrix (Phase B.1) is the real enforcement, returning 403 to a cleaner
// regardless of what the client renders.
const OWNER_ADMIN_ROUTE_PREFIXES: string[] = ["/dashboard", "/reporting", "/settings"];

// The cleaner portal (Phase D1). CLEANER-only: a non-cleaner deep-linking
// /portal is bounced to /dashboard, and a cleaner's landing/redirects resolve
// here. The API /portal/* endpoints are require_role(CLEANER), so this is UX +
// deep-link routing, not the enforcement boundary.
const PORTAL_ROUTE_PREFIXES: string[] = ["/portal"];

// The post-auth landing page differs by role: a cleaner's home is the mobile
// portal; owner/admin land on /dashboard.
function landingPathForRole(role: string | null | undefined): string {
  return role === "cleaner" ? "/portal" : "/dashboard";
}

// Public pages reachable without a session. The three C.5 auth flows land here
// from emailed links, so they MUST be allowlisted or an unauthenticated visitor
// is bounced to /login and the reset/invite link dead-ends. `/forgot-password`
// is an exact match; `/reset-password/` and `/invite/` are prefixes because the
// token is a dynamic path segment.
const PUBLIC_PAGE_EXACT: string[] = ["/privacy", "/terms", "/forgot-password"];
const PUBLIC_PAGE_PREFIXES: string[] = ["/reset-password/", "/invite/"];

export default auth((req) => {
  const { nextUrl } = req;
  // A session carrying RefreshTokenError is dead (the backend refresh failed
  // fatally), so treat it as unauthenticated: routing sends it to /login
  // server-side instead of rendering an authenticated-but-empty page while the
  // client SessionGuard catches up, and a dead session can no longer bounce off
  // /login back into the app shell.
  const isAuthenticated = !!req.auth && req.auth.error !== REFRESH_TOKEN_ERROR;
  const role = req.auth?.role;

  const isLoginPage = nextUrl.pathname === "/login";
  const isAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicPage =
    PUBLIC_PAGE_EXACT.includes(nextUrl.pathname) ||
    PUBLIC_PAGE_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
  const isShareLink = nextUrl.pathname.startsWith("/share/");
  const isRoot = nextUrl.pathname === "/";
  const isAdminRoute = ADMIN_ROUTE_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
  const isOwnerAdminRoute = OWNER_ADMIN_ROUTE_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
  const isPortalRoute = PORTAL_ROUTE_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));

  // Allow auth API routes, public pages, and public share links through
  if (isAuthRoute || isPublicPage || isShareLink) return;

  // Redirect authenticated users away from login, to their role's landing page
  if (isLoginPage && isAuthenticated) {
    return Response.redirect(new URL(landingPathForRole(role), nextUrl));
  }

  // Redirect root to the role's landing page (cleaner -> /operations)
  if (isRoot) {
    return Response.redirect(new URL(landingPathForRole(role), nextUrl));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isLoginPage) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  // Admin-only routes: only `admin` role passes; owner and cleaner bounce to /settings.
  // Backend enforces the same gate on /admin/* endpoints; this prevents the page
  // rendering and firing 403-bound API calls for non-admins.
  if (isAdminRoute && role !== "admin") {
    return Response.redirect(new URL("/settings", nextUrl));
  }

  // The cleaner portal is CLEANER-only: a non-cleaner (owner/admin) deep-linking
  // /portal/* is sent to /dashboard. The API gates /portal/* with
  // require_role(CLEANER), so this is deep-link UX, not the enforcement layer.
  if (isPortalRoute && role !== "cleaner") {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  // Owner/admin financial surfaces: a cleaner is bounced to their portal; any
  // other non-owner/admin role falls back to /operations (which is not itself an
  // owner/admin route, so there is no redirect loop). The API matrix (Phase B.1)
  // still enforces 403 on the underlying endpoints; this stops a cleaner
  // deep-linking /dashboard, /reporting, or /settings and firing a wall of
  // 403-bound calls.
  if (isOwnerAdminRoute && role !== "owner" && role !== "admin") {
    return Response.redirect(new URL(role === "cleaner" ? "/portal" : "/operations", nextUrl));
  }
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|be(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
