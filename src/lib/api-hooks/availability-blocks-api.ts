"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import type {
  AvailabilityBlockFilters,
  AvailabilityBlockResponse,
  CreateAvailabilityBlockRequest,
  UpdateAvailabilityBlockRequest,
} from "@/lib/schemas/availability-block";

export function useAvailabilityBlocks(
  filters: AvailabilityBlockFilters = {},
  options: { enabled?: boolean } = {},
) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const params = new URLSearchParams();
  if (filters.propertyId) params.set("property_id", filters.propertyId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const qs = params.toString();

  return useQuery<AvailabilityBlockResponse[]>({
    queryKey: [
      "availability-blocks",
      filters.propertyId ?? "",
      filters.from ?? "",
      filters.to ?? "",
    ],
    queryFn: async () => {
      const response = await apiClient.get<{ data: AvailabilityBlockResponse[] }>(
        `/availability-blocks${qs ? `?${qs}` : ""}`,
      );
      return response.data;
    },
    enabled: isReady && (options.enabled ?? true),
  });
}

/** Calendar events include blocks, so every block mutation refreshes both caches. */
function useInvalidateBlockCaches() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["availability-blocks"] });
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
  };
}

export function useCreateAvailabilityBlock() {
  const apiClient = useApiClient();
  const invalidate = useInvalidateBlockCaches();

  return useMutation({
    mutationFn: async (data: CreateAvailabilityBlockRequest) => {
      const response = await apiClient.post<{ data: AvailabilityBlockResponse }>(
        "/availability-blocks",
        data,
      );
      return response.data;
    },
    // The block drawer surfaces 409 conflicts and failures inline.
    meta: { suppressGlobalError: true },
    onSuccess: invalidate,
  });
}

export function useUpdateAvailabilityBlock() {
  const apiClient = useApiClient();
  const invalidate = useInvalidateBlockCaches();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAvailabilityBlockRequest }) => {
      const response = await apiClient.patch<{ data: AvailabilityBlockResponse }>(
        `/availability-blocks/${id}`,
        data,
      );
      return response.data;
    },
    meta: { suppressGlobalError: true },
    onSuccess: invalidate,
  });
}

export function useDeleteAvailabilityBlock() {
  const apiClient = useApiClient();
  const invalidate = useInvalidateBlockCaches();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/availability-blocks/${id}`);
    },
    meta: { suppressGlobalError: true },
    onSuccess: invalidate,
  });
}
