"use client";

import { useCallback, useState } from "react";

import { ApiError } from "@/lib/api-client";
import {
  useMessagesAPI,
  useMessageThreadAPI,
  useSendMessageAPI,
  useUpdateConversationStatusAPI,
} from "@/lib/api-hooks/messaging-api";
import { useAppStore } from "@/stores/app-store";
import type { Message, MessageStatus } from "@/types/message";

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
  // Keyed by conversationId: only one thread's compose box is visible at a
  // time, but keying by id keeps a stale error from bleeding into a
  // different conversation if the host switches threads mid-failure.
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});
  const sendMessageMutation = useSendMessageAPI();
  const updateStatusMutation = useUpdateConversationStatusAPI();
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
      setReplyErrors((prev) => {
        if (!(conversationId in prev)) return prev;
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
      sendMessageMutation.mutate(
        { conversationId, content },
        {
          onError: (err) => {
            const message =
              err instanceof ApiError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : "Failed to send message";
            setReplyErrors((prev) => ({ ...prev, [conversationId]: message }));
            addToast({ type: "error", message });
          },
        },
      );
    },
    [sendMessageMutation, addToast],
  );

  const clearReplyError = useCallback((conversationId: string) => {
    setReplyErrors((prev) => {
      if (!(conversationId in prev)) return prev;
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  }, []);

  return {
    markAsRead,
    toggleFlag,
    archive,
    sendReply,
    localUpdates,
    replyErrors,
    clearReplyError,
  };
}
