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
  const { markAsRead, toggleFlag, archive, sendReply, convertToMaintenance } = useMessageActions();

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
        className="shrink-0 overflow-y-auto border-r"
        style={{ width: "40%", borderColor: "var(--border)" }}
      >
        {messages.length === 0 && (
          <p className="py-lg text-body text-center text-gray-400">No messages</p>
        )}
        {messages.map((msg) => (
          <button
            key={msg.id}
            type="button"
            onClick={() => setSelectedMessage(msg.id)}
            className="gap-sm px-sm py-sm flex w-full items-center border-b text-left transition-colors hover:bg-gray-50"
            style={{
              borderColor: "var(--border)",
              backgroundColor: selectedMessage === msg.id ? "var(--neutral-30)" : undefined,
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
              <div className="gap-xs flex items-center">
                <span
                  className="h-xs w-xs shrink-0 rounded-full"
                  style={{
                    backgroundColor: channelColors[msg.channel] ?? "var(--channel-direct)",
                  }}
                />
                <span className="text-body truncate text-gray-500">{msg.listingName}</span>
              </div>
              <p className="text-body truncate text-gray-400">{msg.subject}</p>
            </div>

            <span className="gap-xs text-body flex shrink-0 items-center text-gray-400">
              <MessageSquare size={10} />
              {msg.messageCount}
            </span>
          </button>
        ))}
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
            onResolve={() => {
              markAsRead(selectedMsg.id);
              archive(selectedMsg.id);
            }}
            onFollowUp={() => toggleFlag(selectedMsg.id)}
            onPriority={() => toggleFlag(selectedMsg.id)}
            onConvertMaintenance={() => convertToMaintenance(selectedMsg.id)}
          />
        )}
      </div>
    </div>
  );
}
