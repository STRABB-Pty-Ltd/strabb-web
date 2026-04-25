"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import type { Maintenance, MaintenanceListResponse } from "@/types/maintenance";
import type { Vacancy } from "@/types/vacancy";

export interface MaintenanceFilters {
  propertyId?: string;
  listingId?: string;
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export function useMaintenanceAPI(filters?: MaintenanceFilters) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const params = new URLSearchParams();
  if (filters?.propertyId) params.set("property_id", filters.propertyId);
  if (filters?.listingId) params.set("listing_id", filters.listingId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters?.dateTo) params.set("date_to", filters.dateTo);
  params.set("page", String(filters?.page ?? 1));
  params.set("page_size", String(filters?.pageSize ?? 20));

  return useQuery<MaintenanceListResponse>({
    queryKey: ["maintenance", JSON.stringify(filters ?? {})],
    queryFn: async () => {
      const response = await apiClient.get<MaintenanceListResponse>(
        `/maintenance?${params.toString()}`,
      );
      return response;
    },
    enabled: !USE_MOCK && isReady,
  });
}

export function useMaintenance(id: string | null) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<Maintenance | null>({
    queryKey: ["maintenance", "detail", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<{ data: Maintenance }>(`/maintenance/${id}`);
      return response.data;
    },
    enabled: !USE_MOCK && isReady && !!id,
  });
}

export function useCreateMaintenanceAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Maintenance>) => apiClient.post("/maintenance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    },
  });
}

export function useUpdateMaintenanceAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Maintenance> }) =>
      apiClient.put(`/maintenance/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    },
  });
}

export function useDeleteMaintenanceAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/maintenance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    },
  });
}

export function useVacancyAPI(
  selectedListings: string[],
  startDate?: string,
  endDate?: string,
  minGapDays?: number,
) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  if (minGapDays) params.set("min_gap_days", String(minGapDays));

  return useQuery<Vacancy[]>({
    queryKey: ["vacancy", ...selectedListings, startDate, endDate, minGapDays],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Vacancy[] }>(`/vacancy?${params.toString()}`);
      return response.data;
    },
    enabled: !USE_MOCK && isReady,
  });
}
