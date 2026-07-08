"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ApiError } from "@/lib/api-client";

/**
 * Query retry predicate. Never retry an auth/authorization/billing failure: a
 * 401 is fatal (session dead), a 403 is deterministic (role-gated), and a 402
 * is deterministic (subscription lapsed, F.10) - retrying just burns API calls
 * and delays the quiet empty state / the billing banner. Everything else keeps
 * the previous single-retry behaviour (one retry, i.e. two attempts total).
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 402 || error.status === 403)
  ) {
    return false;
  }
  return failureCount < 1;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 60 seconds
            retry: shouldRetryQuery,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
