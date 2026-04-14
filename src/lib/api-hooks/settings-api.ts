"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";

export function useSettingsSectionAPI<T = Record<string, unknown>>(section: string) {
  const apiClient = useApiClient();

  return useQuery<T>({
    queryKey: ["settings", section],
    queryFn: async () => {
      const response = await apiClient.get<{ data: T }>(`/settings/${section}`);
      return response.data;
    },
    enabled: !USE_MOCK,
  });
}

export function useUpdateSettingsSectionAPI<T = Record<string, unknown>>(section: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: T) => apiClient.put(`/settings/${section}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", section] });
    },
  });
}
