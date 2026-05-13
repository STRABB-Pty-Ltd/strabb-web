"use client";

import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
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
      style={{
        borderColor: "var(--border)",
        // canvas-top is the offset of fixed top-nav + submenu-bar
        height: "calc(100vh - var(--canvas-top))",
      }}
    >
      {/* Left pane - message list */}
      <div
        className="gap-base p-base flex shrink-0 flex-col overflow-y-auto rounded-l-lg border-r"
        style={{
          width: "40%",
          borderColor: "var(--border)",
          backgroundColor: "var(--neutral-30)",
        }}
      >
        {messages.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title="No messages"
            description="New conversations from connected channels will land here."
          />
        )}
        {messages.map((msg) => {
          const isSelected = selectedMessage === msg.id;
          const channelColor = channelColors[msg.channel] ?? "var(--channel-direct)";
          return (
            <button
              key={msg.id}
              type="button"
              onClick={() => setSelectedMessage(msg.id)}
              className="gap-sm px-md py-sm bg-surface-60 flex w-full items-center rounded-lg text-left transition-shadow hover:shadow-sm"
              style={{
                borderLeft: `var(--stripe-width) solid ${channelColor}`,
                outline: isSelected ? `var(--hairline) solid ${channelColor}` : undefined,
                outlineOffset: isSelected ? "calc(-1 * var(--hairline))" : undefined,
              }}
            >
              {/* Unread dot - paired with sr-only label so the unread state
                  isn't communicated by colour alone. */}
              <span
                className="h-base w-base shrink-0 rounded-full"
                style={{
                  backgroundColor: msg.status === "unread" ? "var(--highlight-10)" : "transparent",
                }}
                aria-hidden="true"
              />
              {msg.status === "unread" && <span className="sr-only">Unread.</span>}

              <div className="min-w-0 flex-1">
                <div className="gap-base flex items-center justify-between">
                  <span className="text-body text-highlight-10 truncate font-medium">
                    {msg.guestName}
                  </span>
                  <span className="text-body text-highlight-10 shrink-0">
                    {format(new Date(msg.lastMessageTime), "d MMM")}
                  </span>
                </div>
                <span className="text-body text-highlight-10 block truncate">
                  {msg.listingName}
                </span>
                <p className="text-body text-highlight-10 truncate">{msg.subject}</p>
              </div>

              <span className="gap-xs text-body text-highlight-10 flex shrink-0 items-center">
                <MessageSquare size={10} />
                {msg.messageCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right pane - thread */}
      <div className="flex-1">
        {!selectedMsg ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-body text-highlight-10">Select a message to view</p>
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
