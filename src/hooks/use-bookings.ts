"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export function useBooking(id: string | null) {
  const apiClient = useApiClient();

  return useQuery<BookingResponse | null>({
    queryKey: [...BOOKINGS_KEY, "detail", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<{ data: BookingResponse }>(`/bookings/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
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

// Payload for POST /bookings. The backend stamps source=direct +
// generates a manual:<uuid> idempotency key server-side, so the form
// only collects the human-facing fields. Dates are ISO strings
// matching the backend's datetime parsing.
export interface CreateBookingRequest {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestCount?: number | null;
  totalAmount?: number | null;
  notes?: string | null;
  status?: "confirmed" | "pending";
}

// Payload for PATCH /bookings/{id}. All fields optional. Pass
// `status: "cancelled"` to cancel — the backend's F.6 hook restores
// stay-night availability and pushes to Channex from there.
export interface UpdateBookingRequest {
  checkIn?: string;
  checkOut?: string;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestCount?: number | null;
  totalAmount?: number | null;
  notes?: string | null;
  status?: "confirmed" | "pending" | "cancelled" | "checked_in" | "checked_out";
}

export function useCreateBooking() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      const response = await apiClient.post<{ data: Record<string, unknown> }>("/bookings", data);
      return keysToCamel<BookingResponse>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
    },
  });
}

export function useUpdateBooking() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & UpdateBookingRequest) => {
      const response = await apiClient.patch<{ data: Record<string, unknown> }>(
        `/bookings/${id}`,
        data,
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
        {},
      );
      return keysToCamel<BookingResponse>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
    },
  });
}
