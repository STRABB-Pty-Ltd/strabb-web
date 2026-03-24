"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "./use-api-client";
import { useAuthenticatedQuery } from "./use-authenticated-query";
import { keysToCamel } from "@/lib/case-utils";
import type {
  BookingFilters,
  BookingListResponse,
  BookingResponse,
  BookingSummaryResponse,
} from "@/lib/schemas/booking";

const BOOKINGS_KEY = ["bookings"];

export function useBookings(filters: BookingFilters = {}, page = 1, pageSize = 20) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (filters.propertyId) params.set("property_id", filters.propertyId);
  if (filters.listingId) params.set("listing_id", filters.listingId);
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.status) params.set("status", filters.status);
  if (filters.conflictStatus) params.set("conflict_status", filters.conflictStatus);
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);

  const queryKey = [...BOOKINGS_KEY, JSON.stringify(filters), String(page), String(pageSize)];

  return useAuthenticatedQuery<BookingListResponse>(queryKey, `/bookings?${params.toString()}`, {
    select: (raw) => keysToCamel<BookingListResponse>(raw),
  });
}

export function useBookingSummary() {
  return useAuthenticatedQuery<BookingSummaryResponse>(
    [...BOOKINGS_KEY, "summary"],
    "/bookings/summary",
    {
      select: (raw) => keysToCamel<BookingSummaryResponse>(raw),
    },
  );
}

export function useUpdateBookingNotes() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string | null }) => {
      const response = await apiClient.patch<{ data: Record<string, unknown> }>(
        `/bookings/${id}/notes`,
        { notes },
      );
      return keysToCamel<BookingResponse>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
    },
  });
}

export function useDismissConflict() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ data: Record<string, unknown> }>(
        `/bookings/${id}/dismiss-conflict`,
      );
      return keysToCamel<BookingResponse>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
    },
  });
}
