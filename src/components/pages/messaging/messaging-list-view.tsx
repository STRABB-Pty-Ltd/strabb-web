"use client";

import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

import { useMessageActions, useMessageThread } from "@/hooks/use-messaging";
import type { Message } from "@/types/message";
import { useAppStore } from "@/stores/app-store";

import { MessageThread } from "./message-thread";

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

interface MessagingListViewProps {
  messages: Message[];
}

export function MessagingListView({ messages }: MessagingListViewProps) {
  const selectedMessage = useAppStore((s) => s.messaging.selectedMessage);
  const setSelectedMessage = useAppStore((s) => s.setSelectedMessage);
  const { toggleFlag, sendReply, convertToTicket } = useMessageActions();

  const selectedMsg = messages.find((m) => m.id === selectedMessage) ?? null;
  const { data: rawThread } = useMessageThread(selectedMessage);
  const thread = rawThread ?? [];

  return (
    <div
      className="flex rounded-lg border"
      style={{ borderColor: "var(--border)", height: "calc(100vh - 144px)" }}
    >
      {/* Left pane — message list */}
      <div
        className="gap-base p-base flex shrink-0 flex-col overflow-y-auto rounded-l-lg border-r"
        style={{
          width: "40%",
          borderColor: "var(--border)",
          backgroundColor: "var(--neutral-30)",
        }}
      >
        {messages.length === 0 && (
          <p className="py-lg text-body text-center text-gray-400">No messages</p>
        )}
        {messages.map((msg) => {
          const isSelected = selectedMessage === msg.id;
          const channelColor = channelColors[msg.channel] ?? "var(--channel-direct)";
          return (
            <button
              key={msg.id}
              type="button"
              onClick={() => setSelectedMessage(msg.id)}
              className="gap-sm px-md py-sm flex w-full items-center rounded-lg bg-white text-left transition-shadow hover:shadow-sm"
              style={{
                borderLeft: `4px solid ${channelColor}`,
                outline: isSelected ? `2px solid ${channelColor}` : "none",
                outlineOffset: isSelected ? "-2px" : undefined,
              }}
            >
              {/* Unread dot */}
              <span
                className="h-base w-base shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    msg.status === "unread" ? "var(--strabb-secondary)" : "transparent",
                }}
              />

              <div className="min-w-0 flex-1">
                <div className="gap-base flex items-center justify-between">
                  <span className="text-body truncate font-medium text-gray-800">
                    {msg.guestName}
                  </span>
                  <span className="text-body shrink-0 text-gray-400">
                    {format(new Date(msg.lastMessageTime), "d MMM")}
                  </span>
                </div>
                <span className="text-body block truncate text-gray-500">{msg.listingName}</span>
                <p className="text-body truncate text-gray-400">{msg.subject}</p>
              </div>

              <span className="gap-xs text-body flex shrink-0 items-center text-gray-400">
                <MessageSquare size={10} />
                {msg.messageCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right pane — thread */}
      <div className="flex-1">
        {!selectedMsg ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-body text-gray-400">Select a message to view</p>
          </div>
        ) : (
          <MessageThread
            message={selectedMsg}
            thread={thread}
            onSendReply={sendReply}
            onFlag={() => toggleFlag(selectedMsg.id)}
            onConvertTicket={() => convertToTicket(selectedMsg.id)}
          />
        )}
      </div>
    </div>
  );
}
