"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "./use-api-client";
import { useAuthenticatedQuery } from "./use-authenticated-query";
import { keysToCamel, keysToSnake } from "@/lib/case-utils";
import type {
  CleaningTaskListResponse,
  CleaningTaskResponse,
} from "@/lib/schemas/cleaning-task";

const TASKS_KEY = ["cleaning-tasks"];

interface UseCleaningTasksOptions {
  propertyId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useCleaningTasks({
  propertyId,
  status,
  page = 1,
  pageSize = 20,
}: UseCleaningTasksOptions = {}) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (propertyId) params.set("property_id", propertyId);
  if (status) params.set("status", status);

  return useAuthenticatedQuery<CleaningTaskListResponse>(
    [...TASKS_KEY, propertyId ?? "all", status ?? "all", String(page)],
    `/cleaning-tasks?${params.toString()}`,
    { select: (raw) => keysToCamel<CleaningTaskListResponse>(raw) },
  );
}

export function useCleaningTask(id: string | null) {
  const apiClient = useApiClient();

  return useQuery<CleaningTaskResponse | null>({
    queryKey: [...TASKS_KEY, "detail", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<{ data: CleaningTaskResponse }>(`/cleaning-tasks/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useUpdateCleaningTask() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await apiClient.put<{ data: Record<string, unknown> }>(
        `/cleaning-tasks/${id}`,
        keysToSnake(data),
      );
      return keysToCamel<CleaningTaskResponse>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-preview"] });
    },
  });
}

export function useCompleteCleaningTask() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ data: Record<string, unknown> }>(
        `/cleaning-tasks/${id}/complete`,
        {},
      );
      return keysToCamel<CleaningTaskResponse>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-preview"] });
    },
  });
}

export function useResendNotification() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ data: { sent: boolean } }>(
        `/cleaning-tasks/${id}/resend-notification`,
        {},
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-preview"] });
    },
  });
}
