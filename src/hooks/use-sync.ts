"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "./use-api-client";

interface SyncTriggerResponse {
  listingsSynced: number;
  listingsFailed: number;
  bookingsCreated: number;
  bookingsUpdated: number;
  bookingsUnchanged: number;
  conflictsDetected: number;
}

export function useTriggerSync() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{ data: SyncTriggerResponse }>("/sync/trigger");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}
