"use client";

import { useSession } from "next-auth/react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { REFRESH_TOKEN_ERROR } from "@/lib/auth-constants";

import { useApiClient } from "./use-api-client";

/**
 * Convenience hook that combines useQuery with the authenticated API client.
 * Waits for a valid session before firing - prevents 401s during session loading.
 */
export function useAuthenticatedQuery<T>(
  queryKey: string[],
  endpoint: string,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">,
) {
  const { data: session, status } = useSession();
  const apiClient = useApiClient();
  const isReady =
    status === "authenticated" && !!session?.accessToken && session?.error !== REFRESH_TOKEN_ERROR;

  return useQuery<T>({
    queryKey,
    queryFn: () => apiClient.get<T>(endpoint),
    ...options,
    enabled: isReady && (options?.enabled ?? true),
  });
}
