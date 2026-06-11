"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { createAuthenticatedClient } from "@/lib/api-client";
import { REFRESH_TOKEN_ERROR } from "@/lib/auth-constants";

/**
 * Hook that returns an API client pre-bound with the current session's access token.
 * Use this in client components to make authenticated API calls.
 */
export function useApiClient() {
  const { data: session } = useSession();

  return useMemo(
    () => createAuthenticatedClient(session?.accessToken ?? ""),
    [session?.accessToken],
  );
}

/**
 * Returns true when the session is authenticated and has a valid access token.
 * Use in `enabled` conditions to prevent queries firing before auth is ready.
 */
export function useAuthReady() {
  const { data: session, status } = useSession();
  return (
    status === "authenticated" &&
    !!session?.accessToken &&
    session?.error !== REFRESH_TOKEN_ERROR
  );
}
