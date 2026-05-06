"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import type { CleaningTask } from "@/types/cleaning-task";
import type { ShoppingItem } from "@/types/shopping-item";

// Backend cleaning task shape after global keysToCamel. Money fields arrive
// as JS numbers (Pydantic Money type emits numeric JSON), not strings.
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
  estimatedHours: number;
  checklistTotal: number;
  checklistDone: number;
  cost: number | null;
  currency?: string;
  linkedTicketId?: string | null;
}

function mapCleaningTask(raw: RawCleaningTask): CleaningTask {
  return {
    id: raw.id,
    listingId: raw.listingId,
    listingName: "",
    listingColor: "",
    bookingId: raw.bookingId,
    cleanerName: raw.cleanerName,
    cleanerEmail: raw.cleanerEmail,
    scheduledTime: raw.scheduledTime ?? raw.scheduledDate ?? "",
    completedTime: null,
    checklistTotal: raw.checklistTotal,
    checklistDone: raw.checklistDone,
    priority: raw.priority as CleaningTask["priority"],
    status: raw.status as CleaningTask["status"],
    type: raw.taskType as CleaningTask["type"],
    estimatedHours: raw.estimatedHours,
    cost: raw.cost,
    currency: raw.currency,
    notes: raw.notes,
    linkedTicketId: raw.linkedTicketId ?? null,
  };
}

export function useCleaningTasksAPI(submenuFilters: string[], selectedListings: string[]) {
  const isReady = useAuthReady();
  const apiClient = useApiClient();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_id", id));

  const statusMap: Record<string, string> = {
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
      const response = await apiClient.get<{ data: RawCleaningTask[] }>(
        `/cleaning-tasks?${params.toString()}`,
      );
      return response.data.map(mapCleaningTask);
    },
    enabled: isReady,
  });
}

export function useShoppingListAPI(selectedListings: string[]) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_id", id));

  return useQuery<ShoppingItem[]>({
    queryKey: ["shopping-list", ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ShoppingItem[] }>(
        `/cleaning-tasks/shopping-list?${params.toString()}`,
      );
      return response.data;
    },
    enabled: isReady,
  });
}

export function useCreateCleaningTaskAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CleaningTask>) => apiClient.post("/cleaning-tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-preview"] });
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
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-preview"] });
    },
  });
}

export function useLinkTicketToClean() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cleanId, ticketId }: { cleanId: string; ticketId: string }) =>
      apiClient.patch(`/cleaning-tasks/${cleanId}/link-ticket`, { ticket_id: ticketId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useUnlinkTicketFromClean() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cleanId: string) => apiClient.delete(`/cleaning-tasks/${cleanId}/link-ticket`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaning-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
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
