import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  const isLoginPage = nextUrl.pathname === "/login";
  const isAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isRoot = nextUrl.pathname === "/";

  // Allow auth API routes through
  if (isAuthRoute) return;

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
});

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
