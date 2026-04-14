"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import type { Message, ThreadMessage } from "@/types/message";

export function useMessagesAPI(
  channels: string[],
  submenuFilters: string[],
  selectedListings: string[],
) {
  const apiClient = useApiClient();
  const params = new URLSearchParams();
  channels.forEach((ch) => params.append("channel", ch));
  const statusFilter = submenuFilters.find((f) =>
    ["unread", "flagged", "read", "archived"].includes(f),
  );
  if (statusFilter) params.set("status", statusFilter);
  selectedListings.forEach((id) => params.append("listing_id", id));

  return useQuery<Message[]>({
    queryKey: ["conversations", ...channels, ...submenuFilters, ...selectedListings],
    queryFn: () => apiClient.get(`/conversations?${params.toString()}`),
    enabled: !USE_MOCK,
  });
}

export function useMessageThreadAPI(messageId: string | null) {
  const apiClient = useApiClient();

  return useQuery<ThreadMessage[]>({
    queryKey: ["conversation-messages", messageId ?? ""],
    queryFn: () => apiClient.get(`/conversations/${messageId}/messages`),
    enabled: !USE_MOCK && !!messageId,
  });
}

export function useSendMessageAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      apiClient.post(`/conversations/${conversationId}/messages`, { content }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation-messages", variables.conversationId],
      });
    },
  });
}

export function useUpdateConversationStatusAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/conversations/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useUpdateConversationPriorityAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: string }) =>
      apiClient.patch(`/conversations/${id}/priority`, { priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useConvertToMaintenanceAPI() {
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      apiClient.post(`/conversations/${conversationId}/convert-to-maintenance`, {}),
  });
}
