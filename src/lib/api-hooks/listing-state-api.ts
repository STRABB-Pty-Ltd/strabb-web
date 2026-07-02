"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import type {
  AvailabilityUpdateRequest,
  DailyListingStateListResponse,
  DailyListingStateResponse,
  RateUpdateRequest,
  RestrictionsUpdateRequest,
} from "@/lib/schemas/listing-state";

/**
 * Hooks for the F.4 + F.7a per-listing daily state surface. Used by the
 * listings settings page's Rates / Restrictions / Availability tabs.
 *
 * All read queries lazy-load via `enabled` so a collapsed listing row
 * does NOT fetch its calendar data — only when the user expands the row
 * and lands on the relevant tab.
 */

/**
 * GET /listings/{id}/state?date_from=...&date_to=...
 *
 * `enabled` is the gate the caller passes: typically
 * `isAuthReady && isRowExpanded && activeTab === "rates"` so we don't
 * fetch for collapsed rows or for the wrong tab.
 */
export function useListingStateAPI(
  listingId: string,
  dateFrom: string,
  dateTo: string,
  enabled: boolean = true,
) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<DailyListingStateResponse[]>({
    queryKey: ["listing-state", listingId, dateFrom, dateTo],
    queryFn: async () => {
      const response = await apiClient.get<DailyListingStateListResponse>(
        `/listings/${listingId}/state?date_from=${dateFrom}&date_to=${dateTo}`,
      );
      return response.data;
    },
    enabled: isReady && enabled,
  });
}

/**
 * PATCH /listings/{id}/rates — set rate for a single date or inclusive
 * range. Body is the discriminated `RateUpdateRequest`.
 *
 * On success we invalidate every `listing-state` query for the affected
 * listing — the calendar may be looking at a different window than the
 * one we just edited (e.g. user edited September while viewing October),
 * so invalidating the whole listing-state namespace is the safe call.
 */
export function useUpdateListingRates() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      body,
    }: {
      listingId: string;
      body: RateUpdateRequest;
    }): Promise<void> => {
      // Backend returns 204 No Content; the calendar refreshes from the
      // GET /state invalidation in onSuccess. (Returning one row per
      // affected date timed out large-range edits client-side — bug #4.)
      await apiClient.patch(`/listings/${listingId}/rates`, body);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["listing-state", variables.listingId],
      });
    },
  });
}

/**
 * PATCH /listings/{id}/restrictions — set any subset of the 5
 * restriction fields (minStay, maxStay, closedToArrival,
 * closedToDeparture, stopSell) for a single date or inclusive range.
 *
 * Body shape mirrors the backend RestrictionsUpdate schema: callers
 * only include fields they want to change, the backend leaves omitted
 * fields untouched. At least one field is required server-side.
 */
export function useUpdateListingRestrictions() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      body,
    }: {
      listingId: string;
      body: RestrictionsUpdateRequest;
    }): Promise<void> => {
      // Backend returns 204; calendar refreshes via the GET /state
      // invalidation in onSuccess (bug #4).
      await apiClient.patch(`/listings/${listingId}/restrictions`, body);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["listing-state", variables.listingId],
      });
    },
  });
}

/**
 * PATCH /listings/{id}/availability — set the bookable-units count for
 * a single date or inclusive range. Body shape is the discriminated
 * `AvailabilityUpdateRequest` (count + date | count + dateFrom/dateTo).
 *
 * Driven by the F.9 Availability tab: hosts use this to manually block
 * a date (count=0) or open multi-unit listings (count >= 2). The
 * automatic booking-driven decrement from F.6 also lands rows here,
 * but via a different path (worker -> daily_listing_state, not via the
 * UI).
 */
export function useUpdateListingAvailability() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      body,
    }: {
      listingId: string;
      body: AvailabilityUpdateRequest;
    }): Promise<void> => {
      // Backend returns 204; calendar refreshes via the GET /state
      // invalidation in onSuccess (bug #4).
      await apiClient.patch(`/listings/${listingId}/availability`, body);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["listing-state", variables.listingId],
      });
    },
  });
}
