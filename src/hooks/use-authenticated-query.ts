"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { useApiClient } from "./use-api-client";

/**
 * Convenience hook that combines useQuery with the authenticated API client.
 * Establishes the standard data fetching pattern for the project.
 */
export function useAuthenticatedQuery<T>(
  queryKey: string[],
  endpoint: string,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">,
) {
  const apiClient = useApiClient();

  return useQuery<T>({
    queryKey,
    queryFn: () => apiClient.get<T>(endpoint),
    ...options,
  });
}
