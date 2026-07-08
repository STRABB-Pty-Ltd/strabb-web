"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";

export interface TenantResponse {
  id: string;
  name: string;
  subdomain: string | null;
}

export function useTenantMe() {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<TenantResponse>({
    queryKey: ["tenant-me"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: TenantResponse }>("/tenants/me");
      return response.data;
    },
    enabled: isReady,
  });
}

export function useUpdateSubdomain() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subdomain: string | null): Promise<TenantResponse> => {
      const response = await apiClient.patch<{ data: TenantResponse }>("/tenants/me/subdomain", {
        subdomain,
      });
      return response.data;
    },
    meta: { suppressGlobalError: true },
    onSuccess: (data) => {
      queryClient.setQueryData(["tenant-me"], data);
    },
  });
}
