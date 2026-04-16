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
  onResolve: () => void;
  onFollowUp: () => void;
  onPriority: () => void;
  onConvertMaintenance: () => void;
}

export function MessageThread({
  message,
  thread,
  onSendReply,
  onResolve,
  onFollowUp,
  onPriority,
  onConvertMaintenance,
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
      <div className="shrink-0 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{message.guestName}</h3>
            <p className="text-xs text-gray-500">{message.listingName}</p>
            <p className="text-xs text-gray-400">
              {message.checkIn} &ndash; {message.checkOut}
            </p>
          </div>
          <span
            className="rounded px-2 py-0.5 text-xs font-medium text-white"
            style={{
              backgroundColor: channelColors[message.channel] ?? "#6B7280",
            }}
          >
            {message.channel.replace("_", ".")}
          </span>
        </div>
      </div>

      {/* Thread messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {thread.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isGuest ? "justify-start" : "justify-end"}`}>
            <div
              className="max-w-[80%] px-3 py-2"
              style={{
                backgroundColor: msg.isGuest ? "#F3F4F6" : "var(--strabb-secondary)",
                color: msg.isGuest ? "#374151" : "white",
                borderRadius: msg.isGuest ? "12px 12px 12px 0" : "12px 12px 0 12px",
              }}
            >
              <p className="text-xs font-medium opacity-70">{msg.senderName}</p>
              <p className="text-sm">{msg.content}</p>
              <p className="mt-1 text-xs opacity-50">
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
      <div className="flex gap-2 border-t px-4 py-2" style={{ borderColor: "var(--border)" }}>
        <button
          type="button"
          onClick={onResolve}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Resolved
        </button>
        <button
          type="button"
          onClick={onFollowUp}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Follow Up
        </button>
        <button
          type="button"
          onClick={onPriority}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Priority
        </button>
        <button
          type="button"
          onClick={onConvertMaintenance}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Maintenance
        </button>
      </div>

      {/* Compose */}
      <div className="flex gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <textarea
          value={compose}
          onChange={(e) => setCompose(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 resize-none rounded-lg border p-2 text-sm"
          rows={2}
        />
        <button
          type="button"
          onClick={handleSend}
          className="self-end rounded-lg p-2 text-white"
          style={{ backgroundColor: "var(--strabb-secondary)" }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
