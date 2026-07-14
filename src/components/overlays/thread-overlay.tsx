"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { Archive, Flag, Send, TicketPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { chipVariants } from "@/components/ui/chip";
import { Drawer, DrawerCloseButton } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { formatChannel } from "@/lib/channels";
import { cn } from "@/lib/utils";
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

/* Chip-shaped triage action - outline pill grown to the WCAG touch target. */
const triageChipClass = cn(
  chipVariants({ tone: "outline", radius: "pill", interactive: true }),
  "gap-xs px-sm py-base hover:border-highlight-10 min-h-[var(--touch-target-min)] transition-colors",
);

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

  const handleSend = () => {
    if (!compose.trim()) return;
    onSendReply(compose);
    setCompose("");
  };

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

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={data.guestName}
      width="thread"
      zIndex={Z.THREAD}
      scrimZIndex={Z.THREAD_SCRIM}
      // Escape is handled by the global keyboard shortcuts in app-shell.tsx
      closeOnEscape={false}
      // Body hosts its own scroller so the triage bar + composer stay pinned.
      bodyClassName="flex flex-col overflow-hidden p-0"
      header={
        <div className="px-sm py-sm shrink-0 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-body text-highlight-10 font-semibold">{data.guestName}</h2>
              <p className="text-body text-highlight-10">{data.listingName}</p>
              <p className="text-body text-highlight-10">
                {format(new Date(data.checkIn), "d MMM")} -{" "}
                {format(new Date(data.checkOut), "d MMM yyyy")}
              </p>
            </div>
            <div className="gap-base flex items-center">
              <Chip
                tone="solid"
                size="sm"
                radius="sm"
                color={channelColors[data.channel] ?? "var(--channel-direct)"}
              >
                {formatChannel(data.channel)}
              </Chip>
              <DrawerCloseButton onClick={onClose} label="Close thread" />
            </div>
          </div>
        </div>
      }
    >
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
        <button type="button" onClick={onFlag} className={triageChipClass}>
          <Flag size={12} aria-hidden="true" />
          Flag
        </button>
        <button type="button" onClick={onConvertTicket} className={triageChipClass}>
          <TicketPlus size={12} aria-hidden="true" />
          Create Ticket
        </button>
        <button type="button" onClick={onArchive} className={triageChipClass}>
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
            size="icon-touch"
            onClick={handleSend}
            aria-label="Send reply"
            className="self-end"
          >
            <Send size={18} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
