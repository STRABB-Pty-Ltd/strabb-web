"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip, chipVariants } from "@/components/ui/chip";
import { Textarea } from "@/components/ui/textarea";
import { formatChannel } from "@/lib/channels";
import type { Message, ThreadMessage } from "@/types/message";

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
  ota: "var(--channel-ota)",
};

/* Chip-shaped triage action - same outline-pill recipe as the thread
   overlay's triage bar, at this pane's denser padding. */
const triageChipClass = chipVariants({
  tone: "outline",
  radius: "pill",
  size: "md",
  interactive: true,
});

interface MessageThreadProps {
  message: Message;
  thread: ThreadMessage[];
  onSendReply: (conversationId: string, content: string) => void;
  onFlag: () => void;
  onConvertTicket: () => void;
  replyError?: string | null;
  onDismissReplyError?: () => void;
  /** Mobile single-pane mode: returns to the message list. Omitted on
   *  desktop, where the list and thread panes are both visible at once. */
  onBack?: () => void;
}

export function MessageThread({
  message,
  thread,
  onSendReply,
  onFlag,
  onConvertTicket,
  replyError,
  onDismissReplyError,
  onBack,
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
          <div className="gap-xs flex items-center">
            {onBack && (
              <Button
                type="button"
                variant="secondary"
                size="icon-touch"
                onClick={onBack}
                aria-label="Back to messages"
                className="shrink-0"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </Button>
            )}
            <div>
              <h3 className="text-body text-highlight-10 font-semibold">{message.guestName}</h3>
              <p className="text-body text-highlight-10">{message.listingName}</p>
              <p className="text-body text-highlight-10">
                {format(new Date(message.checkIn), "d MMM")} &ndash;{" "}
                {format(new Date(message.checkOut), "d MMM yyyy")}
              </p>
            </div>
          </div>
          <Chip
            tone="solid"
            size="sm"
            radius="sm"
            color={channelColors[message.channel] ?? "var(--channel-direct)"}
          >
            {formatChannel(message.channel)}
          </Chip>
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
        <button type="button" onClick={onFlag} className={triageChipClass}>
          Flag
        </button>
        <button type="button" onClick={onConvertTicket} className={triageChipClass}>
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
          <Textarea
            value={compose}
            onChange={(e) => {
              setCompose(e.target.value);
              onDismissReplyError?.();
            }}
            placeholder="Type a message..."
            aria-label="Compose reply"
            className="min-h-0 flex-1 resize-none"
            rows={2}
          />
          <Button
            type="button"
            size="icon-touch"
            onClick={handleSend}
            aria-label="Send reply"
            className="self-end"
          >
            <Send size={18} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
