"use client";

import { useId, useRef, useState } from "react";
import { format } from "date-fns";
import { Archive, Flag, Send, TicketPlus, X } from "lucide-react";

import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { canvasOverlayStyle } from "@/lib/canvas-overlay-style";
import { formatChannel } from "@/lib/channels";
import { Z } from "@/lib/z-index";
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
  onSendReply: (content: string) => void;
  onFlag: () => void;
  onArchive: () => void;
  onConvertTicket: () => void;
  replyError?: string | null;
  onDismissReplyError?: () => void;
}

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
  ota: "var(--channel-ota)",
};

const EXIT_MS = 200;

export function ThreadOverlay({
  open,
  onClose,
  guestName,
  listingName,
  checkIn,
  checkOut,
  channel,
  messages,
  onSendReply,
  onFlag,
  onArchive,
  onConvertTicket,
  replyError,
  onDismissReplyError,
}: ThreadOverlayProps) {
  const [compose, setCompose] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { shouldRender } = useDelayedClose(open, EXIT_MS);

  const handleSend = () => {
    if (!compose.trim()) return;
    onSendReply(compose);
    setCompose("");
  };

  useClickOutside(panelRef, onClose, open);
  // Side drawer: rails stay live, no Tab trap. App-shell handles Esc globally.
  useFocusTrap(panelRef, { active: open, trap: false });

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
      {/* Scrim - canvas-bounded; clicking outside the panel closes the overlay. */}
      <div
        onClick={onClose}
        style={{
          ...canvasOverlayStyle,
          zIndex: Z.THREAD_SCRIM,
          backgroundColor: "var(--scrim)",
          animation: !open
            ? `fadeOut ${EXIT_MS}ms ease-in forwards`
            : `fadeIn ${EXIT_MS}ms ease-out`,
        }}
      />

      {/* Panel - canvas-bounded: top aligns with canvas content top so the
          panel never protrudes into the topnav/submenu. Right + bottom
          inset by --space-md to match canvas content padding from screen edges. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed flex flex-col overflow-hidden rounded-2xl bg-[var(--neutral-30)] shadow-xl"
        style={{
          zIndex: Z.THREAD,
          top: "calc(var(--canvas-top) + var(--space-md) - 2px)",
          right: "var(--space-md)",
          bottom: "var(--space-md)",
          width: "var(--thread-width)",
          animation: !open
            ? `slideOutRight ${EXIT_MS}ms ease-in forwards`
            : `slideInRight ${EXIT_MS}ms ease-out`,
        }}
      >
        {/* Booking context header */}
        <div className="px-sm py-sm shrink-0 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 id={titleId} className="text-body text-highlight-10 font-semibold">
                {data.guestName}
              </h2>
              <p className="text-body text-highlight-10">{data.listingName}</p>
              <p className="text-body text-highlight-10">
                {format(new Date(data.checkIn), "d MMM")} -{" "}
                {format(new Date(data.checkOut), "d MMM yyyy")}
              </p>
            </div>
            <div className="gap-base flex items-center">
              <span
                className="px-base py-xs text-body text-text-on-color rounded font-medium"
                style={{
                  backgroundColor: channelColors[data.channel] ?? "var(--channel-direct)",
                }}
              >
                {formatChannel(data.channel)}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close thread"
                className="p-xs text-highlight-10 hover:bg-neutral-30 rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
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
            className="gap-xs px-sm py-base text-body border-neutral-30 text-highlight-10 hover:border-highlight-10 hover:bg-neutral-30 hover:text-highlight-10 inline-flex min-h-[var(--touch-target-min)] items-center rounded-full border transition-colors"
          >
            <Flag size={12} aria-hidden="true" />
            Flag
          </button>
          <button
            type="button"
            onClick={onConvertTicket}
            className="gap-xs px-sm py-base text-body border-neutral-30 text-highlight-10 hover:border-highlight-10 hover:bg-neutral-30 hover:text-highlight-10 inline-flex min-h-[var(--touch-target-min)] items-center rounded-full border transition-colors"
          >
            <TicketPlus size={12} aria-hidden="true" />
            Create Ticket
          </button>
          <button
            type="button"
            onClick={onArchive}
            className="gap-xs px-sm py-base text-body border-neutral-30 text-highlight-10 hover:bg-neutral-30 hover:text-highlight-10 inline-flex min-h-[var(--touch-target-min)] items-center rounded-full border transition-colors"
          >
            <Archive size={12} aria-hidden="true" />
            Archive
          </button>
        </div>

        {/* Compose area */}
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
              style={{ backgroundColor: "var(--surface-60)", borderColor: "var(--border)" }}
              rows={2}
            />
            <button
              type="button"
              onClick={handleSend}
              aria-label="Send reply"
              className="p-base text-text-on-color flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center self-end rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
