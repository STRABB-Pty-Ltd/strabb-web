"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import type { Message, ThreadMessage } from "@/types/message";

// Backend conversation shape after global keysToCamel
interface RawConversation {
  id: string;
  bookingId: string;
  listingId: string;
  listingName: string;
  guestName: string;
  channel: string;
  subject: string;
  preview: string;
  status: string;
  priority: string;
  lastMessageAt: string;
  messageCount: number;
  checkIn: string;
  checkOut: string;
}

// Backend message shape after global keysToCamel
interface RawThreadMessage {
  id: string;
  conversationId: string;
  senderType: string;
  body: string;
  sentAt: string;
  senderName: string;
}

function mapConversation(raw: RawConversation): Message {
  return {
    id: raw.id,
    bookingId: raw.bookingId,
    listingId: raw.listingId,
    listingName: raw.listingName,
    guestName: raw.guestName,
    channel: raw.channel as Message["channel"],
    status: raw.status as Message["status"],
    priority: raw.priority as Message["priority"],
    subject: raw.subject,
    lastMessageTime: raw.lastMessageAt,
    messageCount: raw.messageCount,
    isGuest: false,
    previewText: raw.preview,
    checkIn: raw.checkIn,
    checkOut: raw.checkOut,
  };
}

function mapThreadMessage(raw: RawThreadMessage): ThreadMessage {
  return {
    id: raw.id,
    messageId: raw.conversationId,
    content: raw.body,
    sentAt: raw.sentAt,
    isGuest: raw.senderType === "guest",
    senderName: raw.senderName,
  };
}

export function useMessagesAPI(
  channels: string[],
  submenuFilters: string[],
  selectedListings: string[],
) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const params = new URLSearchParams();
  channels.forEach((ch) => params.append("channel", ch));
  const statusFilter = submenuFilters.find((f) =>
    ["unread", "flagged", "read", "archived"].includes(f),
  );
  if (statusFilter) params.set("status", statusFilter);
  selectedListings.forEach((id) => params.append("listing_id", id));

  return useQuery<Message[]>({
    queryKey: ["conversations", ...channels, ...submenuFilters, ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawConversation[] }>(`/conversations?${params.toString()}`);
      return response.data.map(mapConversation);
    },
    enabled: !USE_MOCK && isReady,
  });
}

export function useMessageThreadAPI(messageId: string | null) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<ThreadMessage[]>({
    queryKey: ["conversation-messages", messageId ?? ""],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawThreadMessage[] }>(`/conversations/${messageId}/messages`);
      return response.data.map(mapThreadMessage);
    },
    enabled: !USE_MOCK && isReady && !!messageId,
  });
}

export function useSendMessageAPI() {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      apiClient.post(`/conversations/${conversationId}/messages`, { body: content }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversation-messages", variables.conversationId],
      });
    },
  });
}

export function useUpdateConversationStatusAPI() {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
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
  const isReady = useAuthReady();
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
  const isReady = useAuthReady();

  return useMutation({
    mutationFn: (conversationId: string) =>
      apiClient.post(`/conversations/${conversationId}/convert-to-maintenance`, {}),
  });
}
