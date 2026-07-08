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
  deliveryStatus: string;
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
    deliveryStatus: raw.deliveryStatus === "failed" ? "failed" : "sent",
  };
}

const STATUS_FILTERS = ["unread", "flagged", "read", "archived"] as const;

export function useMessagesAPI(
  channels: string[],
  submenuFilters: string[],
  selectedListings: string[],
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
    return query.data.filter((m) => active.includes(m.status));
  }, [query.data, submenuFilters]);

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
    meta: { suppressGlobalError: true },
    // Invalidate on both outcomes: the backend persists the message row
    // (delivery_status="failed" on error) and commits before raising 422/502,
    // so the failed send is already in the thread on the server either way -
    // refetch here or it stays invisible until some other action happens to
    // invalidate the query.
    onSettled: (_data, _error, variables) => {
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
