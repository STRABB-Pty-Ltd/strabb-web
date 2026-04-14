"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import type { CleaningTask } from "@/types/cleaning-task";
import type { ShoppingItem } from "@/types/shopping-item";

// Backend cleaning task shape after global keysToCamel
interface RawCleaningTask {
  id: string;
  bookingId: string | null;
  propertyId: string;
  listingId: string;
  cleanerName: string | null;
  cleanerEmail: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  status: string;
  notes: string | null;
  taskType: string;
  priority: string;
  estimatedHours: string | number;
  checklistTotal: number;
  checklistDone: number;
  cost: string | null;
}

function mapCleaningTask(raw: RawCleaningTask): CleaningTask {
  return {
    id: raw.id,
    listingId: raw.listingId,
    listingName: "",
    listingColor: "",
    bookingId: raw.bookingId,
    assigneeName: raw.cleanerName,
    assigneeEmail: raw.cleanerEmail,
    scheduledTime: raw.scheduledTime ?? raw.scheduledDate ?? "",
    completedTime: null,
    checklistTotal: raw.checklistTotal,
    checklistDone: raw.checklistDone,
    priority: raw.priority as CleaningTask["priority"],
    status: raw.status as CleaningTask["status"],
    type: raw.taskType as CleaningTask["type"],
    estimatedHours: typeof raw.estimatedHours === "string" ? parseFloat(raw.estimatedHours) : raw.estimatedHours,
    notes: raw.notes,
  };
}

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
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawCleaningTask[] }>(`/cleaning-tasks?${params.toString()}`);
      return response.data.map(mapCleaningTask);
    },
    enabled: !USE_MOCK,
  });
}

export function useShoppingListAPI(selectedListings: string[]) {
  const apiClient = useApiClient();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_id", id));

  return useQuery<ShoppingItem[]>({
    queryKey: ["shopping-list", ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ShoppingItem[] }>(`/cleaning-tasks/shopping-list?${params.toString()}`);
      return response.data;
    },
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
