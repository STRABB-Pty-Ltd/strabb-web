"use client";

import { useState } from "react";
import { Archive, Flag, Send, TicketPlus, X } from "lucide-react";

import type { ThreadMessage } from "@/types/message";

interface ThreadOverlayProps {
  open: boolean;
  onClose: () => void;
  guestName: string;
  listingName: string;
  checkIn: string;
  checkOut: string;
  channel: string;
  messages: ThreadMessage[];
}

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

export function ThreadOverlay({
  open,
  onClose,
  guestName,
  listingName,
  checkIn,
  checkOut,
  channel,
  messages,
}: ThreadOverlayProps) {
  const [compose, setCompose] = useState("");

  // Escape key is handled by the global keyboard shortcuts in app-shell.tsx

  if (!open) return null;

  return (
    <>
      {/* Scrim */}
      <div className="fixed inset-0 z-[170] bg-black/30" />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 z-[175] flex h-full flex-col bg-white shadow-xl"
        style={{
          width: "var(--thread-width)",
          animation: "slideInRight 300ms ease",
        }}
      >
        {/* Booking context header */}
        <div className="shrink-0 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">{guestName}</h2>
              <p className="text-xs text-gray-500">{listingName}</p>
              <p className="text-xs text-gray-400">
                {checkIn} &ndash; {checkOut}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="rounded px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: channelColors[channel] ?? "#6B7280" }}
              >
                {channel.replace("_", ".")}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Thread body */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((msg) => (
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
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
          >
            <Flag size={12} />
            Flag
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <TicketPlus size={12} />
            Create Ticket
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <Archive size={12} />
            Archive
          </button>
        </div>

        {/* Compose area */}
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
            className="self-end rounded-lg p-2 text-white"
            style={{ backgroundColor: "var(--strabb-secondary)" }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
