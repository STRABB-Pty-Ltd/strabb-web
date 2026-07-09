"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "./use-api-client";
import { useAuthenticatedQuery } from "./use-authenticated-query";
import { keysToCamel } from "@/lib/case-utils";
import type { SyncLogResponse } from "@/lib/schemas/admin";

const SYNC_KEY = ["sync"];

interface SyncTriggerResponse {
  listingsSynced: number;
  listingsFailed: number;
  bookingsCreated: number;
  bookingsUpdated: number;
  bookingsUnchanged: number;
  conflictsDetected: number;
}

interface SyncLogsListResponse {
  data: SyncLogResponse[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function useSyncLogs(page = 1, pageSize = 20) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  return useAuthenticatedQuery<SyncLogsListResponse>(
    [...SYNC_KEY, "logs", String(page), String(pageSize)],
    `/sync/logs?${params.toString()}`,
    { select: (raw) => keysToCamel<SyncLogsListResponse>(raw) },
  );
}

export function useTriggerSync() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{ data: SyncTriggerResponse }>("/sync/trigger", {});
      return response.data;
    },
    meta: { suppressGlobalError: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: SYNC_KEY });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
