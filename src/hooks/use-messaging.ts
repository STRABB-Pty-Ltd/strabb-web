"use client";

import { useCallback, useState } from "react";

import {
  useMessagesAPI,
  useMessageThreadAPI,
  useSendMessageAPI,
  useUpdateConversationStatusAPI,
  useConvertToTicketAPI,
} from "@/lib/api-hooks/messaging-api";
import type { Message, MessageStatus } from "@/types/message";
import { useAppStore } from "@/stores/app-store";

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
  const noteConversationAction = useAppStore((s) => s.noteConversationAction);

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

  const markAsUnread = useCallback(
    (id: string) => {
      setLocalUpdates((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: "unread" as MessageStatus },
      }));
      updateStatusMutation.mutate({ id, status: "unread" });
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
      noteConversationAction(id);
    },
    [updateStatusMutation, noteConversationAction],
  );

  const archive = useCallback(
    (id: string) => {
      setLocalUpdates((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: "archived" as MessageStatus },
      }));
      updateStatusMutation.mutate({ id, status: "archived" });
      noteConversationAction(id);
    },
    [updateStatusMutation, noteConversationAction],
  );

  const sendReply = useCallback(
    (conversationId: string, content: string) => {
      sendMessageMutation.mutate({ conversationId, content });
      // Cancel any pending read-on-open revert: the host has actioned it.
      noteConversationAction(conversationId);
    },
    [sendMessageMutation, noteConversationAction],
  );

  const convertToTicket = useCallback(
    (conversationId: string) => {
      convertMutation.mutate(conversationId);
      noteConversationAction(conversationId);
    },
    [convertMutation, noteConversationAction],
  );

  return {
    markAsRead,
    markAsUnread,
    toggleFlag,
    archive,
    sendReply,
    convertToTicket,
    localUpdates,
  };
}
