"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import type { Ticket, TicketListResponse } from "@/types/ticket";
import type { Vacancy } from "@/types/vacancy";

export interface TicketFilters {
  propertyId?: string;
  listingId?: string;
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export function useTicketsAPI(filters?: TicketFilters) {
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

  return useQuery<TicketListResponse>({
    queryKey: ["tickets", JSON.stringify(filters ?? {})],
    queryFn: async () => {
      const response = await apiClient.get<TicketListResponse>(`/tickets?${params.toString()}`);
      return response;
    },
    enabled: !USE_MOCK && isReady,
  });
}

export function useTicket(id: string | null) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<Ticket | null>({
    queryKey: ["tickets", "detail", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<{ data: Ticket }>(`/tickets/${id}`);
      return response.data;
    },
    enabled: !USE_MOCK && isReady && !!id,
  });
}

export function useCreateTicketAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Ticket>) => apiClient.post("/tickets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useUpdateTicketAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ticket> }) =>
      apiClient.put(`/tickets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useDeleteTicketAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tickets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
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
