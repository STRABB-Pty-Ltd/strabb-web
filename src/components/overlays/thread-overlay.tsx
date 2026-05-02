"use client";

import { useRef, useState } from "react";
import { Archive, Flag, Send, TicketPlus, X } from "lucide-react";

import { useDelayedClose } from "@/hooks/use-delayed-close";
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

const EXIT_MS = 300;

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
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  // Cache the props that drive header + body so the panel keeps showing
  // the conversation that was just open through the slide-out animation.
  // While open we trust the live props; only fall back during close.
  const lastDataRef = useRef({ guestName, listingName, checkIn, checkOut, channel, messages });
  if (open) {
    lastDataRef.current = { guestName, listingName, checkIn, checkOut, channel, messages };
  }
  const data = open
    ? { guestName, listingName, checkIn, checkOut, channel, messages }
    : lastDataRef.current;

  // Escape key is handled by the global keyboard shortcuts in app-shell.tsx

  if (!shouldRender) return null;

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-[170]"
        style={{
          backgroundColor: "var(--scrim)",
          animation: !open ? `fadeOut ${EXIT_MS}ms ease forwards` : `fadeIn ${EXIT_MS}ms ease`,
        }}
      />

      {/* Panel - floats inset from the viewport edges with rounded corners */}
      <div
        className="fixed z-[175] flex flex-col overflow-hidden rounded-2xl bg-[var(--neutral-30)] shadow-xl"
        style={{
          top: "var(--space-md)",
          right: "var(--space-md)",
          bottom: "var(--space-md)",
          width: "var(--thread-width)",
          animation: !open
            ? `slideOutRight ${EXIT_MS}ms ease forwards`
            : `slideInRight ${EXIT_MS}ms ease`,
        }}
      >
        {/* Booking context header */}
        <div className="px-sm py-sm shrink-0 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-body font-semibold text-gray-800">{data.guestName}</h2>
              <p className="text-body text-gray-500">{data.listingName}</p>
              <p className="text-body text-gray-400">
                {data.checkIn} - {data.checkOut}
              </p>
            </div>
            <div className="gap-base flex items-center">
              <span
                className="px-base py-xs text-body rounded font-medium text-white dark:text-[var(--brand-10)]"
                style={{
                  backgroundColor: channelColors[data.channel] ?? "var(--channel-direct)",
                }}
              >
                {data.channel.replace("_", ".")}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close thread"
                className="p-xs rounded text-gray-400 hover:bg-gray-100"
                data-no-elevate
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Thread body */}
        <div className="space-y-sm p-sm flex-1 overflow-y-auto">
          {data.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isGuest ? "justify-start" : "justify-end"}`}>
              <div
                className="px-sm py-base max-w-[80%]"
                style={{
                  backgroundColor: msg.isGuest ? "var(--neutral-30)" : "var(--strabb-secondary)",
                  color: msg.isGuest ? "var(--brand-10)" : "var(--surface-60)",
                  borderRadius: msg.isGuest
                    ? "var(--radius-lg) var(--radius-lg) var(--radius-lg) 0"
                    : "var(--radius-lg) var(--radius-lg) 0 var(--radius-lg)",
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
            className="gap-xs px-sm py-xs text-body inline-flex items-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
          >
            <Flag size={12} />
            Flag
          </button>
          <button
            type="button"
            className="gap-xs px-sm py-xs text-body inline-flex items-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <TicketPlus size={12} />
            Create Ticket
          </button>
          <button
            type="button"
            className="gap-xs px-sm py-xs text-body inline-flex items-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <Archive size={12} />
            Archive
          </button>
        </div>

        {/* Compose area */}
        <div
          className="gap-base px-sm py-sm flex border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <textarea
            value={compose}
            onChange={(e) => setCompose(e.target.value)}
            placeholder="Type a message..."
            className="p-base text-body flex-1 resize-none rounded-lg border"
            rows={2}
          />
          <button
            type="button"
            className="p-base self-end rounded-lg text-white"
            style={{ backgroundColor: "var(--strabb-secondary)" }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
