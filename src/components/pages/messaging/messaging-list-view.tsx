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
  const { markAsRead, toggleFlag, archive, sendReply, convertToMaintenance } =
    useMessageActions();

  const selectedMsg = messages.find((m) => m.id === selectedMessage) ?? null;
  const { data: thread } = useMessageThread(selectedMessage);

  return (
    <div className="flex rounded-lg border" style={{ borderColor: "var(--border)", height: "calc(100vh - 160px)" }}>
      {/* Left pane — message list */}
      <div
        className="shrink-0 overflow-y-auto border-r"
        style={{ width: "40%", borderColor: "var(--border)" }}
      >
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            No messages
          </p>
        )}
        {messages.map((msg) => (
          <button
            key={msg.id}
            type="button"
            onClick={() => setSelectedMessage(msg.id)}
            className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-gray-50"
            style={{
              borderColor: "var(--border)",
              backgroundColor:
                selectedMessage === msg.id ? "#F0F7FF" : undefined,
            }}
          >
            {/* Unread dot */}
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  msg.status === "unread"
                    ? "var(--strabb-secondary)"
                    : "transparent",
              }}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-gray-800">
                  {msg.guestName}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {format(new Date(msg.lastMessageTime), "d MMM")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      channelColors[msg.channel] ?? "#6B7280",
                  }}
                />
                <span className="truncate text-xs text-gray-500">
                  {msg.listingName}
                </span>
              </div>
              <p className="truncate text-xs text-gray-400">
                {msg.subject}
              </p>
            </div>

            <span className="flex shrink-0 items-center gap-0.5 text-xs text-gray-400">
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
            <p className="text-sm text-gray-400">
              Select a message to view
            </p>
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
            onConvertMaintenance={() =>
              convertToMaintenance(selectedMsg.id)
            }
          />
        )}
      </div>
    </div>
  );
}
