"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import type { ShareFilters, ShareableMenu } from "@/lib/share-filters";

export interface ShareCreatePayload {
  menu: ShareableMenu;
  filters: ShareFilters;
  expiresAt?: string | null;
}

export interface ShareCreateData {
  id: string;
  token: string;
  publicUrl: string;
  menu: string;
  expiresAt: string | null;
}

export interface ShareableLink {
  id: string;
  token: string;
  publicUrl: string;
  menu: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastAccessedAt: string | null;
}

export function useCreateShare() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ShareCreatePayload): Promise<ShareCreateData> => {
      const response = await apiClient.post<{ data: ShareCreateData }>("/share/create", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shareable-links"] });
    },
  });
}

export function useShareableLinks() {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<ShareableLink[]>({
    queryKey: ["shareable-links"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ShareableLink[] }>("/shareable-links");
      return response.data;
    },
    enabled: isReady,
  });
}

export function useRevokeShareableLink() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<ShareableLink> => {
      const response = await apiClient.patch<{ data: ShareableLink }>(
        `/shareable-links/${id}/revoke`,
        {},
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shareable-links"] });
    },
  });
}
