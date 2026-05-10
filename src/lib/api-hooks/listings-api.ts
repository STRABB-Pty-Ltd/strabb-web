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

export function useUpdateChannexMapping() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      channexPropertyId,
    }: {
      listingId: string;
      channexPropertyId: string | null;
    }): Promise<ListingResponse> => {
      const response = await apiClient.patch<{ data: ListingResponse }>(
        `/listings/${listingId}/channex-mapping`,
        { channexPropertyId },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings-hierarchy"] });
    },
  });
}
