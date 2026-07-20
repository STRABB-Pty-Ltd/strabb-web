"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

/**
 * Drops all cached server state when the signed-in identity changes within the
 * same browser tab.
 *
 * The React Query client is created once and lives for the tab's lifetime, and
 * several query keys are parameterless (e.g. `tenant-me`, `listings-hierarchy`,
 * `saved-reports`), so they collide exactly across tenants. On a soft user
 * switch (a 24h session expiry soft-redirects to /login, then a different user
 * signs in via `signIn({ redirect: false })` without a full page reload) the
 * surviving cache would otherwise serve the previous tenant's data for up to
 * `staleTime`. Explicit logout already hard-navigates and discards the client;
 * this closes the soft-switch and expiry gap. See bug sweep 18-07-2026 finding #4.
 *
 * Must render inside both SessionProvider and QueryClientProvider.
 */
export function CacheResetOnIdentityChange() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const lastIdentity = useRef<string | null>(null);
  const initialised = useRef(false);

  // undefined = still resolving (do nothing); null = signed out; else the
  // stable tenant+user identity for the current session.
  const identity =
    status === "loading" ? undefined : session ? `${session.tenantId}:${session.userId}` : null;

  useEffect(() => {
    if (identity === undefined) return;
    if (!initialised.current) {
      // First resolved identity for this tab: record it, never clear (the
      // cache is fresh and already belongs to this identity).
      initialised.current = true;
      lastIdentity.current = identity;
      return;
    }
    if (identity !== lastIdentity.current) {
      lastIdentity.current = identity;
      queryClient.clear();
    }
  }, [identity, queryClient]);

  return null;
}
