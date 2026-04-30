"use client";

import { useMemo } from "react";

import { mockMessageList } from "./index";
import type { Message, ThreadMessage } from "@/types/message";

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

function getThreadContent(index: number, msg: Message, isGuest: boolean): string {
  if (index === 0) return msg.previewText;
  if (isGuest) {
    const guestMessages = [
      "Thanks for getting back to me!",
      "That sounds great, looking forward to it.",
      "One more thing - is there parking available?",
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

export function useMessagesMock(
  channels: string[],
  submenuFilters: string[],
  selectedListings: string[],
) {
  return useMemo(() => {
    let msgs = [...mockMessageList];

    if (selectedListings.length > 0) {
      msgs = msgs.filter((m) => selectedListings.includes(m.listingId));
    }

    if (channels.length > 0) {
      msgs = msgs.filter((m) => channels.includes(m.channel));
    }

    const showAll = submenuFilters.length === 0 || submenuFilters.includes("overview");
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
}

export function useMessageThreadMock(messageId: string | null) {
  return useMemo(() => {
    if (!messageId) return [];
    const msg = mockMessageList.find((m) => m.id === messageId);
    if (!msg) return [];
    return generateThread(msg);
  }, [messageId]);
}
