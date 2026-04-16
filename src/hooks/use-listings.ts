"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "./use-api-client";
import { useAuthenticatedQuery } from "./use-authenticated-query";
import type {
  ListingCreateFormData,
  ListingListResponse,
  ListingResponse,
  ListingUpdateFormData,
} from "@/lib/schemas/listing";

const LISTINGS_KEY = ["listings"];

interface UseListingsOptions {
  propertyId?: string;
  page?: number;
  pageSize?: number;
}

export function useListings({ propertyId, page = 1, pageSize = 100 }: UseListingsOptions = {}) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (propertyId) {
    params.set("property_id", propertyId);
  }

  return useAuthenticatedQuery<ListingListResponse>(
    [...LISTINGS_KEY, propertyId ?? "all", String(page), String(pageSize)],
    `/listings?${params.toString()}`,
    {
      select: (response) => ({
        ...response,
        data: response.data.map((item) => {
          const raw = item as unknown as Record<string, unknown>;
          return {
            ...item,
            // Backend returns listingType, frontend Listing type expects relationship
            relationship: (raw.listingType as string) ?? (raw.relationship as string),
          } as ListingResponse;
        }),
      }),
    },
  );
}

export function useCreateListing() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ListingCreateFormData) => {
      const response = await apiClient.post<{ data: ListingResponse }>("/listings", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
    },
  });
}

export function useUpdateListing() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ListingUpdateFormData }) => {
      const response = await apiClient.put<{ data: ListingResponse }>(`/listings/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
    },
  });
}

export function useDeleteListing() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/listings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
    },
  });
}
