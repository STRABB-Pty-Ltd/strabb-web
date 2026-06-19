"use client";

import { useCallback, useState } from "react";

import {
  useMessagesAPI,
  useMessageThreadAPI,
  useSendMessageAPI,
  useUpdateConversationStatusAPI,
  useConvertToTicketAPI,
} from "@/lib/api-hooks/messaging-api";
import { ApiError } from "@/lib/api-client";
import type { Message, MessageStatus } from "@/types/message";
import { useAppStore } from "@/stores/app-store";

// Build a sensible ticket description from a conversation, since the
// convert-to-ticket endpoint requires a non-empty description.
export function ticketDescriptionFor(
  message: Pick<Message, "subject" | "previewText" | "guestName">,
): string {
  return (
    message.subject?.trim() ||
    message.previewText?.trim() ||
    (message.guestName ? `Guest enquiry from ${message.guestName}` : "Converted from conversation")
  );
}

export function useMessages(
  channels: string[],
  submenuFilters: string[],
  selectedListings: string[],
) {
  const apiResult = useMessagesAPI(channels, submenuFilters, selectedListings);

  return {
    data: apiResult.data,
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useMessageThread(messageId: string | null) {
  const apiResult = useMessageThreadAPI(messageId);

  return {
    data: apiResult.data,
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useMessageActions() {
  const [localUpdates, setLocalUpdates] = useState<Record<string, Partial<Message>>>({});
  const sendMessageMutation = useSendMessageAPI();
  const updateStatusMutation = useUpdateConversationStatusAPI();
  const convertMutation = useConvertToTicketAPI();
  const addToast = useAppStore((s) => s.addToast);

  const markAsRead = useCallback(
    (id: string) => {
      setLocalUpdates((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: "read" as MessageStatus },
      }));
      updateStatusMutation.mutate({ id, status: "read" });
    },
    [updateStatusMutation],
  );

  const toggleFlag = useCallback(
    (id: string) => {
      setLocalUpdates((prev) => {
        const current = prev[id]?.status;
        const newStatus: MessageStatus = current === "flagged" ? "read" : "flagged";
        updateStatusMutation.mutate({ id, status: newStatus });
        return { ...prev, [id]: { ...prev[id], status: newStatus } };
      });
    },
    [updateStatusMutation],
  );

  const archive = useCallback(
    (id: string) => {
      setLocalUpdates((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: "archived" as MessageStatus },
      }));
      updateStatusMutation.mutate({ id, status: "archived" });
    },
    [updateStatusMutation],
  );

  const sendReply = useCallback(
    (conversationId: string, content: string) => {
      sendMessageMutation.mutate({ conversationId, content });
    },
    [sendMessageMutation],
  );

  const convertToTicket = useCallback(
    (conversationId: string, description: string) => {
      convertMutation.mutate(
        { conversationId, description },
        {
          onSuccess: () => addToast({ type: "success", message: "Ticket created" }),
          onError: (err: unknown) => {
            const message = err instanceof ApiError ? err.message : "Failed to create ticket";
            addToast({ type: "error", message });
          },
        },
      );
    },
    [convertMutation, addToast],
  );

  return {
    markAsRead,
    toggleFlag,
    archive,
    sendReply,
    convertToTicket,
    localUpdates,
  };
}
