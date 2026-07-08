"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ApiError } from "@/lib/api-client";
import { useAppStore } from "@/stores/app-store";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /**
       * Set on mutations that own their error UX (inline form errors or a
       * bespoke toast) so the global MutationCache handler stays silent and
       * exactly one message shows per failure.
       */
      suppressGlobalError?: boolean;
    };
  }
}

/** Fallback copy when a failed mutation carries no usable message. */
export const GENERIC_MUTATION_ERROR = "Something went wrong, changes were not saved";

/**
 * Human-readable message for a failed request. Prefers the API error envelope
 * (ApiError.message already carries the backend detail), then any Error
 * message, then the generic fallback - never an empty toast.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return GENERIC_MUTATION_ERROR;
}

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

/**
 * Global mutation failure surface: any failed mutation toasts an error unless
 * it opts out via `meta: { suppressGlobalError: true }`. The cache-level
 * handler fires even when the caller awaits `mutateAsync` inside try/catch,
 * which is exactly why forms with their own error UX must set the flag.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.suppressGlobalError) {
          return;
        }
        useAppStore.getState().addToast({ type: "error", message: getErrorMessage(error) });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 60 seconds
        retry: shouldRetryQuery,
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
