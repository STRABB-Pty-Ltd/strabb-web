"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import type { ListingListResponse, ListingResponse } from "@/lib/schemas/listing";

export interface ListingHierarchy {
  properties: {
    id: string;
    name: string;
    listings: { id: string; name: string; color: string }[];
  }[];
}

export interface ListingGroup {
  id: string;
  name: string;
  listingIds: string[];
}

export function useListingsHierarchyAPI() {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<ListingHierarchy>({
    queryKey: ["listings-hierarchy"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ListingHierarchy }>("/listings/hierarchy");
      return response.data;
    },
    enabled: isReady,
  });
}

export function useListingGroupsAPI() {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<ListingGroup[]>({
    queryKey: ["listing-groups"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ListingGroup[] }>("/listing-groups");
      return response.data;
    },
    enabled: isReady,
  });
}

export function useCreateListingGroupAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; listingIds: string[] }) =>
      apiClient.post("/listing-groups", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing-groups"] });
    },
  });
}

export function useUpdateListingGroupAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; listingIds: string[] } }) =>
      apiClient.put(`/listing-groups/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing-groups"] });
    },
  });
}

export function useDeleteListingGroupAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/listing-groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing-groups"] });
    },
  });
}

export function useListingsAPI(pageSize = 100) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<ListingListResponse>({
    queryKey: ["listings", { pageSize }],
    queryFn: async () =>
      apiClient.get<ListingListResponse>(`/listings?page=1&page_size=${pageSize}`),
    enabled: isReady,
  });
}

/**
 * PATCH /listings/{id}/channex-mapping — accepts up to all three
 * Channex resource ids (property, room type, rate plan). Each field is
 * optional: pass a string to set, `null` to clear, or omit it entirely
 * to leave the existing value alone. The backend distinguishes "absent
 * from body" from "explicitly null" via `model_fields_set`.
 */
export interface ChannexMappingUpdate {
  listingId: string;
  channexPropertyId?: string | null;
  channexRoomTypeId?: string | null;
  channexRatePlanId?: string | null;
}

/**
 * Body for PUT /listings/{id} — mirrors the backend `ListingUpdate`
 * schema. Every field is optional; omitted fields are left untouched
 * on the listing.
 *
 * Today only `nightlyRate` is wired into the General tab. The other
 * fields (name, platform, bedrooms, etc.) are supported by the backend
 * and could be surfaced in the UI later — see
 * docs/listings-settings-phase-2.md for the deferred fields list.
 */
export interface ListingUpdateRequest {
  name?: string;
  platform?: string;
  externalListingId?: string | null;
  icalFeedUrl?: string | null;
  listingType?: string;
  parentId?: string | null;
  color?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  maxGuests?: number | null;
  nightlyRate?: number | null;
  location?: string | null;
}

export function useUpdateListing() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      ...fields
    }: { listingId: string } & ListingUpdateRequest): Promise<ListingResponse> => {
      const response = await apiClient.put<{ data: ListingResponse }>(
        `/listings/${listingId}`,
        fields,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings-hierarchy"] });
    },
  });
}

export function useUpdateChannexMapping() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      ...fields
    }: ChannexMappingUpdate): Promise<ListingResponse> => {
      const response = await apiClient.patch<{ data: ListingResponse }>(
        `/listings/${listingId}/channex-mapping`,
        fields,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings-hierarchy"] });
    },
  });
}
