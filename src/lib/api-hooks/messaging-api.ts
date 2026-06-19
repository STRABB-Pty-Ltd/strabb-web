"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
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

const STATUS_FILTERS = ["unread", "flagged", "read", "archived"] as const;

export function useMessagesAPI(
  channels: string[],
  submenuFilters: string[],
  selectedListings: string[],
  pinnedId?: string | null,
) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const params = new URLSearchParams();
  channels.forEach((ch) => params.append("channel", ch));
  selectedListings.forEach((id) => params.append("listing_ids", id));

  // Backend only accepts one status; status filtering happens client-side so
  // the messaging submenu's multi-select (Unread + Flagged + Read) behaves as
  // an OR filter and switching filters does not refetch.
  const query = useQuery<Message[]>({
    queryKey: ["conversations", ...channels, ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawConversation[] }>(
        `/conversations?${params.toString()}`,
      );
      return response.data.map(mapConversation);
    },
    enabled: isReady,
  });

  const filtered = useMemo(() => {
    if (!query.data) return query.data;
    if (submenuFilters.length === 0 || submenuFilters.includes("overview")) {
      return query.data;
    }
    const active = submenuFilters.filter((f) => (STATUS_FILTERS as readonly string[]).includes(f));
    if (active.length === 0) return query.data;
    // Keep the currently-open conversation in view even if its status no
    // longer matches the filter (e.g. read-on-open moves it out of Unread),
    // so it does not vanish from under the user mid-read.
    return query.data.filter((m) => active.includes(m.status) || m.id === pinnedId);
  }, [query.data, submenuFilters, pinnedId]);

  return { ...query, data: filtered };
}

export function useMessageThreadAPI(messageId: string | null) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<ThreadMessage[]>({
    queryKey: ["conversation-messages", messageId ?? ""],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawThreadMessage[] }>(
        `/conversations/${messageId}/messages`,
      );
      return response.data.map(mapThreadMessage);
    },
    enabled: isReady && !!messageId,
  });
}

export function useSendMessageAPI() {
  const apiClient = useApiClient();
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

export function useConvertToTicketAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      description,
      priority,
    }: {
      conversationId: string;
      description: string;
      priority?: string;
    }) =>
      apiClient.post(`/conversations/${conversationId}/convert-to-ticket`, {
        description,
        ...(priority ? { priority } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}
