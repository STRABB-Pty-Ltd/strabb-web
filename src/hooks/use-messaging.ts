"use client";

import { useCallback, useState } from "react";

import { USE_MOCK } from "@/lib/mock-data";
import { useMessagesMock, useMessageThreadMock } from "@/lib/mock-data/messaging-hooks";
import {
  useMessagesAPI,
  useMessageThreadAPI,
  useSendMessageAPI,
  useUpdateConversationStatusAPI,
  useConvertToMaintenanceAPI,
} from "@/lib/api-hooks/messaging-api";
import type { Message, MessageStatus } from "@/types/message";

export function useMessages(
  channels: string[],
  submenuFilters: string[],
  selectedListings: string[],
) {
  const mockResult = useMessagesMock(channels, submenuFilters, selectedListings);
  const apiResult = useMessagesAPI(channels, submenuFilters, selectedListings);

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }

  return {
    data: apiResult.data,
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useMessageThread(messageId: string | null) {
  const mockResult = useMessageThreadMock(messageId);
  const apiResult = useMessageThreadAPI(messageId);

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }

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
  const convertMutation = useConvertToMaintenanceAPI();

  const markAsRead = useCallback(
    (id: string) => {
      setLocalUpdates((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: "read" as MessageStatus },
      }));
      if (!USE_MOCK) {
        updateStatusMutation.mutate({ id, status: "read" });
      }
    },
    [updateStatusMutation],
  );

  const toggleFlag = useCallback(
    (id: string) => {
      setLocalUpdates((prev) => {
        const current = prev[id]?.status;
        const newStatus: MessageStatus = current === "flagged" ? "read" : "flagged";
        if (!USE_MOCK) {
          updateStatusMutation.mutate({ id, status: newStatus });
        }
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
      if (!USE_MOCK) {
        updateStatusMutation.mutate({ id, status: "archived" });
      }
    },
    [updateStatusMutation],
  );

  const sendReply = useCallback(
    (conversationId: string, content: string) => {
      if (!USE_MOCK) {
        sendMessageMutation.mutate({ conversationId, content });
      }
    },
    [sendMessageMutation],
  );

  const convertToMaintenance = useCallback(
    (conversationId: string) => {
      if (!USE_MOCK) {
        convertMutation.mutate(conversationId);
      }
    },
    [convertMutation],
  );

  return {
    markAsRead,
    toggleFlag,
    archive,
    sendReply,
    convertToMaintenance,
    localUpdates,
  };
}
