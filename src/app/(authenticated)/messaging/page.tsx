"use client";

import { useEffect, useRef, useState } from "react";

import { ThreadOverlay } from "@/components/overlays/thread-overlay";
import { TicketDrawer } from "@/components/overlays/ticket-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { MessagingKanbanView } from "./_components/messaging-kanban-view";
import { MessagingListView } from "./_components/messaging-list-view";
import { useMessages, useMessageActions, useMessageThread } from "@/hooks/use-messaging";
import { usePropertyIdForListing } from "@/hooks/use-listings";
import { useAppStore } from "@/stores/app-store";

export default function MessagingPage() {
  const view = useAppStore((s) => s.messaging.view);
  const submenu = useAppStore((s) => s.messaging.submenu);
  const channels = useAppStore((s) => s.messaging.channels);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const selectedMessage = useAppStore((s) => s.messaging.selectedMessage);
  const threadOverlay = useAppStore((s) => s.threadOverlay);
  const closeThreadOverlay = useAppStore((s) => s.closeThreadOverlay);
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false);

  // List view: viewing = right-pane selection. Kanban: viewing = thread
  // overlay open state. Closing the overlay or switching messages ends the
  // viewing session.
  const viewingMessageId =
    view === "kanban" ? (threadOverlay?.open ? threadOverlay.messageId : null) : selectedMessage;

  const { data: messages, isLoading } = useMessages(channels, submenu, selectedListings);
  const { markAsRead, sendReply, toggleFlag, archive } = useMessageActions();

  // markAsRead's identity changes each render (its useCallback dep is the
  // mutation object); route through a ref so the effect can depend only on the
  // viewed id. messagesRef gives the cleanup the live status without re-running
  // on every status change.
  const markAsReadRef = useRef(markAsRead);
  const messagesRef = useRef(messages);
  useEffect(() => {
    markAsReadRef.current = markAsRead;
    messagesRef.current = messages;
  });

  // Mark a conversation read when the host LEAVES it (switches conversation,
  // closes the kanban overlay, or navigates away) rather than on open. This
  // keeps it visible in a filtered view (e.g. Unread) while being read, and
  // drops it out on exit instead of vanishing on click or waiting for a
  // refresh. Re-check status at cleanup so an explicit Flag during the session
  // is not overwritten back to read.
  useEffect(() => {
    if (!viewingMessageId) return;
    const id = viewingMessageId;
    if (messagesRef.current?.find((m) => m.id === id)?.status !== "unread") return;
    return () => {
      if (messagesRef.current?.find((m) => m.id === id)?.status === "unread") {
        markAsReadRef.current(id);
      }
    };
  }, [viewingMessageId]);

  // Cache the live thread message so the overlay keeps rendering with the
  // last conversation through its 300ms close animation. Without this the
  // parent stops passing threadMsg the moment the user clicks close, which
  // unmounts ThreadOverlay before its slide-out fires.
  const liveThreadMsg = threadOverlay
    ? (messages ?? []).find((m) => m.id === threadOverlay.messageId)
    : null;
  const lastThreadMsgRef = useRef(liveThreadMsg ?? null);
  if (liveThreadMsg) lastThreadMsgRef.current = liveThreadMsg;
  const threadMsg = liveThreadMsg ?? lastThreadMsgRef.current;

  const { data: liveThreadMessages } = useMessageThread(threadOverlay?.messageId ?? null);
  const lastThreadMessagesRef = useRef(liveThreadMessages);
  if (liveThreadMessages) lastThreadMessagesRef.current = liveThreadMessages;
  const threadMessages = liveThreadMessages ?? lastThreadMessagesRef.current;

  // Pre-select the ticket form's property from the open conversation's listing.
  const ticketPropertyId = usePropertyIdForListing(threadMsg?.listingId);

  if (isLoading) {
    return (
      <div className="space-y-xs" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading messages</span>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} h={55} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {view === "kanban" && <MessagingKanbanView messages={messages ?? []} />}
      {view === "list" && <MessagingListView messages={messages ?? []} />}

      {threadMsg && (
        <ThreadOverlay
          open={!!threadOverlay?.open}
          onClose={closeThreadOverlay}
          guestName={threadMsg.guestName}
          listingName={threadMsg.listingName}
          checkIn={threadMsg.checkIn}
          checkOut={threadMsg.checkOut}
          channel={threadMsg.channel}
          messages={threadMessages ?? []}
          onSendReply={(content) => sendReply(threadMsg.id, content)}
          onFlag={() => toggleFlag(threadMsg.id)}
          onArchive={() => {
            archive(threadMsg.id);
            closeThreadOverlay();
          }}
          onConvertTicket={() => setTicketDrawerOpen(true)}
        />
      )}

      <TicketDrawer
        open={ticketDrawerOpen}
        onClose={() => setTicketDrawerOpen(false)}
        initialPropertyId={ticketPropertyId}
      />
    </div>
  );
}
