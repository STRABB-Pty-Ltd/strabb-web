"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

import { TicketFormDialog } from "@/app/(authenticated)/operations/_components/ticket-form-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useIsMobile } from "@/hooks/use-responsive-view";
import { useMessageActions, useMessageThread } from "@/hooks/use-messaging";
import { usePropertyIdForListing } from "@/hooks/use-listings";
import type { Message } from "@/types/message";
import { useAppStore } from "@/stores/app-store";

import { MessageThread } from "./message-thread";

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
  ota: "var(--channel-ota)",
};

interface MessagingListViewProps {
  messages: Message[];
}

export function MessagingListView({ messages }: MessagingListViewProps) {
  // lg (1024px), matching the mobile-shell breakpoint everywhere else in
  // the app (M.1) - below it the desktop 40/60 split has no room to work
  // with, so it collapses to one pane at a time instead.
  const isMobile = useIsMobile(1024);
  const selectedMessage = useAppStore((s) => s.messaging.selectedMessage);
  const setSelectedMessage = useAppStore((s) => s.setSelectedMessage);
  const { toggleFlag, sendReply, replyErrors, clearReplyError } = useMessageActions();
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);

  const selectedMsg = messages.find((m) => m.id === selectedMessage) ?? null;
  const { data: rawThread } = useMessageThread(selectedMessage);
  const thread = rawThread ?? [];
  const ticketPropertyId = usePropertyIdForListing(selectedMsg?.listingId);

  const listPane = (
    <div
      className={
        isMobile
          ? "gap-base p-base flex h-full flex-col overflow-y-auto"
          : "gap-base p-base flex h-full shrink-0 flex-col overflow-y-auto rounded-l-lg border-r"
      }
      style={{
        width: isMobile ? undefined : "40%",
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
                  {format(new Date(msg.lastMessageTime), "d MMM, HH:mm")}
                </span>
              </div>
              <span className="text-body text-highlight-10 block truncate">{msg.listingName}</span>
              <p className="text-body text-highlight-10 truncate">{msg.subject}</p>
            </div>

            <span className="gap-xs text-body text-highlight-10 flex shrink-0 items-center">
              <MessageSquare size={10} aria-hidden="true" />
              {msg.messageCount}
            </span>
          </button>
        );
      })}
    </div>
  );

  const threadPane = selectedMsg && (
    <MessageThread
      message={selectedMsg}
      thread={thread}
      onSendReply={sendReply}
      onFlag={() => toggleFlag(selectedMsg.id)}
      onConvertTicket={() => setTicketDialogOpen(true)}
      replyError={replyErrors[selectedMsg.id] ?? null}
      onDismissReplyError={() => clearReplyError(selectedMsg.id)}
      onBack={isMobile ? () => setSelectedMessage(null) : undefined}
    />
  );

  if (isMobile) {
    return (
      <>
        <div
          className="overflow-hidden rounded-lg border"
          style={{
            borderColor: "var(--border)",
            // dvh, not vh: the mobile shell's fixed top bar + bottom nav
            // (M.1) already eat --mobile-topbar-height/--mobile-bottomnav-
            // height, and dvh (unlike vh) shrinks with the on-screen
            // keyboard in supporting browsers, so the pinned composer in
            // MessageThread stays above the keyboard instead of sliding
            // under it. Needs a real-device pass (iOS Safari keyboard
            // behaviour famously diverges from any desktop/emulator check).
            height:
              "calc(100dvh - var(--mobile-topbar-height) - var(--mobile-bottomnav-height) - var(--space-md))",
          }}
        >
          {selectedMsg ? threadPane : listPane}
        </div>
        <TicketFormDialog
          open={ticketDialogOpen}
          onOpenChange={setTicketDialogOpen}
          initialPropertyId={ticketPropertyId}
        />
      </>
    );
  }

  return (
    <div
      className="flex rounded-lg border"
      style={{
        borderColor: "var(--border)",
        // Fill the canvas exactly: the viewport minus the canvas-top offset
        // (fixed top-nav + submenu-bar) AND the canvas's own vertical padding
        // (paddingTop = space-md - 2px, paddingBottom = space-md). Omitting
        // that padding made the box and its border-r divider overshoot the
        // canvas bottom by ~2 * space-md.
        height: "calc(100vh - var(--canvas-top) - 2 * var(--space-md) + 2px)",
      }}
    >
      {listPane}

      {/* Right pane - thread */}
      <div className="flex-1">
        {!selectedMsg ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-body text-highlight-10">Select a message to view</p>
          </div>
        ) : (
          threadPane
        )}
      </div>

      <TicketFormDialog
        open={ticketDialogOpen}
        onOpenChange={setTicketDialogOpen}
        initialPropertyId={ticketPropertyId}
      />
    </div>
  );
}
