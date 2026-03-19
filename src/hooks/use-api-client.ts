"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { createAuthenticatedClient } from "@/lib/api-client";

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
