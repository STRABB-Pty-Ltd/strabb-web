"use client";

import { useState } from "react";
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
}

export function MessageThread({
  message,
  thread,
  onSendReply,
  onFlag,
  onConvertTicket,
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
            <h3 className="text-body font-semibold text-gray-800">{message.guestName}</h3>
            <p className="text-body text-gray-500">{message.listingName}</p>
            <p className="text-body text-gray-400">
              {message.checkIn} &ndash; {message.checkOut}
            </p>
          </div>
          <span
            className="px-base py-xs text-body rounded-sm font-medium text-white"
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
                backgroundColor: msg.isGuest ? "var(--neutral-30)" : "var(--strabb-secondary)",
                color: msg.isGuest ? "var(--brand-10)" : "white",
                borderRadius: msg.isGuest ? "8px 8px 8px 0" : "8px 8px 0 8px",
              }}
            >
              <p className="text-body font-medium opacity-70">{msg.senderName}</p>
              <p className="text-body">{msg.content}</p>
              <p className="mt-xs text-body opacity-50">
                {new Date(msg.sentAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
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
          className="px-sm py-xs text-body rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          Flag
        </button>
        <button
          type="button"
          onClick={onConvertTicket}
          className="px-sm py-xs text-body rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          Create Ticket
        </button>
      </div>

      {/* Compose */}
      <div className="gap-base px-sm py-sm flex border-t" style={{ borderColor: "var(--border)" }}>
        <textarea
          value={compose}
          onChange={(e) => setCompose(e.target.value)}
          placeholder="Type a message..."
          className="p-base text-body flex-1 resize-none rounded-lg border"
          rows={2}
        />
        <button
          type="button"
          onClick={handleSend}
          className="p-base self-end rounded-lg text-white"
          style={{ backgroundColor: "var(--strabb-secondary)" }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
