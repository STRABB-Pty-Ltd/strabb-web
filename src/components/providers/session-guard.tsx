"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

import { REFRESH_TOKEN_ERROR } from "@/lib/auth-constants";

// Consumes the RefreshTokenError flag that auth.ts sets when the backend
// rejects a token refresh (revoked, rotated away, or the dev DB was
// re-seeded). Without this, the NextAuth cookie outlives the dead backend
// session and every page renders authenticated-but-empty (all API calls
// 401) until the user manually clears site data. Signing out instead
// bounces them straight to /login.
export function SessionGuard() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === REFRESH_TOKEN_ERROR) {
      void signOut({ callbackUrl: "/login" });
    }
  }, [session?.error]);

  return null;
}
