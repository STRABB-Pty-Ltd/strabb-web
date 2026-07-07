"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Send } from "lucide-react";

import type { Message, ThreadMessage } from "@/types/message";

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

interface MessageThreadProps {
  message: Message;
  thread: ThreadMessage[];
  onSendReply: (conversationId: string, content: string) => void;
  onFlag: () => void;
  onConvertTicket: () => void;
  replyError?: string | null;
  onDismissReplyError?: () => void;
}

export function MessageThread({
  message,
  thread,
  onSendReply,
  onFlag,
  onConvertTicket,
  replyError,
  onDismissReplyError,
}: MessageThreadProps) {
  const [compose, setCompose] = useState("");

  const handleSend = () => {
    if (!compose.trim()) return;
    onSendReply(message.id, compose);
    setCompose("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Booking context header */}
      <div className="px-sm py-sm shrink-0 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-body text-highlight-10 font-semibold">{message.guestName}</h3>
            <p className="text-body text-highlight-10">{message.listingName}</p>
            <p className="text-body text-highlight-10">
              {format(new Date(message.checkIn), "d MMM")} &ndash;{" "}
              {format(new Date(message.checkOut), "d MMM yyyy")}
            </p>
          </div>
          <span
            className="px-base py-xs text-body rounded-sm font-medium text-[var(--text-on-color)]"
            style={{
              backgroundColor: channelColors[message.channel] ?? "var(--channel-direct)",
            }}
          >
            {message.channel.replace("_", ".")}
          </span>
        </div>
      </div>

      {/* Thread messages */}
      <div className="space-y-sm p-sm flex-1 overflow-y-auto">
        {thread.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isGuest ? "justify-start" : "justify-end"}`}>
            <div
              className="px-sm py-base max-w-[80%]"
              style={{
                backgroundColor: msg.isGuest ? "var(--neutral-30)" : "var(--highlight-10)",
                color: msg.isGuest ? "var(--highlight-10)" : "var(--surface-60)",
                borderRadius: msg.isGuest
                  ? "var(--radius-lg) var(--radius-lg) var(--radius-lg) 0"
                  : "var(--radius-lg) var(--radius-lg) 0 var(--radius-lg)",
              }}
            >
              <p className="text-body font-medium opacity-70">{msg.senderName}</p>
              <p className="text-body">{msg.content}</p>
              <div className="mt-xs gap-xs flex items-center">
                <p className="text-body opacity-50">
                  {format(new Date(msg.sentAt), "d MMM, HH:mm")}
                </p>
                {msg.deliveryStatus === "failed" && (
                  <p className="text-body font-medium" style={{ color: "var(--status-danger)" }}>
                    Failed to send
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Triage bar */}
      <div
        className="gap-base px-sm py-base flex border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          type="button"
          onClick={onFlag}
          className="px-sm py-xs text-body border-neutral-30 text-highlight-10 hover:bg-neutral-30 rounded-full border"
        >
          Flag
        </button>
        <button
          type="button"
          onClick={onConvertTicket}
          className="px-sm py-xs text-body border-neutral-30 text-highlight-10 hover:bg-neutral-30 rounded-full border"
        >
          Create Ticket
        </button>
      </div>

      {/* Compose */}
      <div className="px-sm py-sm border-t" style={{ borderColor: "var(--border)" }}>
        {replyError && (
          <p className="mb-xs text-body" style={{ color: "var(--status-danger)" }} role="alert">
            {replyError}
          </p>
        )}
        <div className="gap-base flex">
          <textarea
            value={compose}
            onChange={(e) => {
              setCompose(e.target.value);
              onDismissReplyError?.();
            }}
            placeholder="Type a message..."
            aria-label="Compose reply"
            className="p-base text-body flex-1 resize-none rounded-lg border"
            rows={2}
          />
          <button
            type="button"
            onClick={handleSend}
            aria-label="Send reply"
            className="p-base text-text-on-color flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center self-end rounded-lg"
            style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
