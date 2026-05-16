import { auth } from "@/lib/auth";

// No client-side admin routes currently - admin endpoints are gated by the
// backend, and the System Health UI lives inside the General settings section
// (which hides itself for non-admin roles via the underlying API 403s).
const ADMIN_ROUTE_PREFIXES: string[] = [];

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const role = req.auth?.role;

  const isLoginPage = nextUrl.pathname === "/login";
  const isAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicPage = nextUrl.pathname === "/privacy" || nextUrl.pathname === "/terms";
  const isShareLink = nextUrl.pathname.startsWith("/share/");
  const isRoot = nextUrl.pathname === "/";
  const isAdminRoute = ADMIN_ROUTE_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));

  // Allow auth API routes, public pages, and public share links through
  if (isAuthRoute || isPublicPage || isShareLink) return;

  // Redirect authenticated users away from login
  if (isLoginPage && isAuthenticated) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect root to dashboard
  if (isRoot) {
    return Response.redirect(new URL("/dashboard", nextUrl));
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
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|be(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
