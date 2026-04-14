"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import type { CleaningTask } from "@/types/cleaning-task";
import type { ShoppingItem } from "@/types/shopping-item";

export function useCleaningTasksAPI(submenuFilters: string[], selectedListings: string[]) {
  const apiClient = useApiClient();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_id", id));

  const statusMap: Record<string, string> = {
    tickets: "pending",
    confirmed: "confirmed",
    pending: "pending",
    archived: "completed",
  };
  const showAll = submenuFilters.length === 0 || submenuFilters.includes("overview");
  if (!showAll) {
    submenuFilters.forEach((f) => {
      const mapped = statusMap[f];
      if (mapped) params.append("status", mapped);
    });
  }

  return useQuery<CleaningTask[]>({
    queryKey: ["cleaning-tasks", ...submenuFilters, ...selectedListings],
    queryFn: () => apiClient.get(`/cleaning-tasks?${params.toString()}`),
    enabled: !USE_MOCK,
  });
}

export function useShoppingListAPI(selectedListings: string[]) {
  const apiClient = useApiClient();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_id", id));

  return useQuery<ShoppingItem[]>({
    queryKey: ["shopping-list", ...selectedListings],
    queryFn: () => apiClient.get(`/cleaning-tasks/shopping-list?${params.toString()}`),
    enabled: !USE_MOCK,
  });
}

export function useCreateCleaningTaskAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CleaningTask>) => apiClient.post("/cleaning-tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-tasks"] });
    },
  });
}

export function useUpdateCleaningTaskAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CleaningTask> }) =>
      apiClient.patch(`/cleaning-tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-tasks"] });
    },
  });
}

export function useCreateShoppingItemAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ShoppingItem>) =>
      apiClient.post("/cleaning-tasks/shopping-list", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });
}

export function useUpdateShoppingItemAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ShoppingItem> }) =>
      apiClient.put(`/cleaning-tasks/shopping-list/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });
}

export function useDeleteShoppingItemAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/cleaning-tasks/shopping-list/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });
}
