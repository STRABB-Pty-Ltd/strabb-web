"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "./use-api-client";
import { useAuthenticatedQuery } from "./use-authenticated-query";
import { keysToCamel, keysToSnake } from "@/lib/case-utils";
import type {
  PropertyCreateFormData,
  PropertyListResponse,
  PropertyResponse,
  PropertyUpdateFormData,
} from "@/lib/schemas/property";

const PROPERTIES_KEY = ["properties"];

interface UsePropertiesOptions {
  page?: number;
  pageSize?: number;
}

export function useProperties({ page = 1, pageSize = 100 }: UsePropertiesOptions = {}) {
  return useAuthenticatedQuery<PropertyListResponse>(
    [...PROPERTIES_KEY, String(page), String(pageSize)],
    `/properties?page=${page}&page_size=${pageSize}`,
    {
      select: (raw) => keysToCamel<PropertyListResponse>(raw),
    },
  );
}

export function useCreateProperty() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PropertyCreateFormData) => {
      const response = await apiClient.post<{ data: Record<string, unknown> }>(
        "/properties",
        keysToSnake(data),
      );
      return keysToCamel<PropertyResponse>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
    },
  });
}

export function useUpdateProperty() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PropertyUpdateFormData }) => {
      const response = await apiClient.put<{ data: Record<string, unknown> }>(
        `/properties/${id}`,
        keysToSnake(data),
      );
      return keysToCamel<PropertyResponse>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
    },
  });
}

export function useDeleteProperty() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
    },
  });
}
