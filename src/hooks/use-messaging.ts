"use client";

import { useCallback, useMemo, useState } from "react";

import { USE_MOCK, mockMessageList } from "@/lib/mock-data";
import type { Message, MessageStatus } from "@/types/message";
import type { ThreadMessage } from "@/types/message";

import { useAuthenticatedQuery } from "./use-authenticated-query";

function generateThread(msg: Message): ThreadMessage[] {
  const count = 3 + Math.floor(msg.messageCount * 1.2);
  const baseTime = new Date(msg.lastMessageTime).getTime();
  const threads: ThreadMessage[] = [];

  for (let i = 0; i < count; i++) {
    const isGuest = i % 2 === 0;
    threads.push({
      id: `${msg.id}-thread-${i + 1}`,
      messageId: msg.id,
      content: getThreadContent(i, msg, isGuest),
      sentAt: new Date(baseTime - (count - i) * 3600000).toISOString(),
      isGuest,
      senderName: isGuest ? msg.guestName : "Host",
    });
  }

  return threads;
}

function getThreadContent(
  index: number,
  msg: Message,
  isGuest: boolean,
): string {
  if (index === 0) return msg.previewText;
  if (isGuest) {
    const guestMessages = [
      "Thanks for getting back to me!",
      "That sounds great, looking forward to it.",
      "One more thing — is there parking available?",
      "Perfect, see you then!",
      "Could you also let me know about check-in instructions?",
    ];
    return guestMessages[index % guestMessages.length];
  }
  const hostMessages = [
    "Hi! Thanks for your message. Let me look into that for you.",
    "Yes, that should be fine. I'll confirm shortly.",
    "All sorted! You'll receive the details via email.",
    "No worries at all. Let me know if you need anything else.",
    "Check-in is from 2pm. I'll send the access code the day before.",
  ];
  return hostMessages[index % hostMessages.length];
}

export function useMessages(
  channels: string[],
  submenuFilters: string[],
  selectedListings: string[],
) {
  const mockResult = useMemo(() => {
    let msgs = [...mockMessageList];

    if (selectedListings.length > 0) {
      msgs = msgs.filter((m) => selectedListings.includes(m.listingId));
    }

    if (channels.length > 0) {
      msgs = msgs.filter((m) => channels.includes(m.channel));
    }

    const showAll =
      submenuFilters.length === 0 || submenuFilters.includes("overview");
    if (!showAll) {
      const statusFilters = submenuFilters.filter((f) =>
        ["unread", "flagged", "read", "archived"].includes(f),
      );
      if (statusFilters.length > 0) {
        msgs = msgs.filter((m) => statusFilters.includes(m.status));
      }
    }

    return msgs;
  }, [channels, submenuFilters, selectedListings]);

  const apiResult = useAuthenticatedQuery<Message[]>(
    ["messages", ...channels, ...submenuFilters, ...selectedListings],
    "/messages",
    { enabled: !USE_MOCK },
  );

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }
  return {
    data: apiResult.data ?? [],
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useMessageThread(messageId: string | null) {
  const mockResult = useMemo(() => {
    if (!messageId) return [];
    const msg = mockMessageList.find((m) => m.id === messageId);
    if (!msg) return [];
    return generateThread(msg);
  }, [messageId]);

  const apiResult = useAuthenticatedQuery<ThreadMessage[]>(
    ["message-thread", messageId ?? ""],
    `/messages/${messageId}/thread`,
    { enabled: !USE_MOCK && !!messageId },
  );

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }
  return {
    data: apiResult.data ?? [],
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useMessageActions() {
  const [localUpdates, setLocalUpdates] = useState<
    Record<string, Partial<Message>>
  >({});

  const markAsRead = useCallback((id: string) => {
    setLocalUpdates((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: "read" as MessageStatus },
    }));
  }, []);

  const toggleFlag = useCallback((id: string) => {
    setLocalUpdates((prev) => {
      const current = prev[id]?.status;
      const newStatus: MessageStatus =
        current === "flagged" ? "read" : "flagged";
      return { ...prev, [id]: { ...prev[id], status: newStatus } };
    });
  }, []);

  const archive = useCallback((id: string) => {
    setLocalUpdates((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: "archived" as MessageStatus },
    }));
  }, []);

  const sendReply = useCallback(
    (_conversationId: string, _content: string) => {
      // In mock mode, no-op. API mode would POST to /conversations/{id}/messages
    },
    [],
  );

  const convertToMaintenance = useCallback((_conversationId: string) => {
    // Placeholder — creates maintenance request from conversation context
  }, []);

  return {
    markAsRead,
    toggleFlag,
    archive,
    sendReply,
    convertToMaintenance,
    localUpdates,
  };
}
