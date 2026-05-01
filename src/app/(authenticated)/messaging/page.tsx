"use client";

import { useEffect, useMemo, useRef } from "react";

import { ThreadOverlay } from "@/components/overlays/thread-overlay";
import { MessagingKanbanView } from "./_components/messaging-kanban-view";
import { MessagingListView } from "./_components/messaging-list-view";
import { useMessages, useMessageActions, useMessageThread } from "@/hooks/use-messaging";
import { useAppStore } from "@/stores/app-store";

export default function MessagingPage() {
  const view = useAppStore((s) => s.messaging.view);
  const submenu = useAppStore((s) => s.messaging.submenu);
  const channels = useAppStore((s) => s.messaging.channels);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const selectedMessage = useAppStore((s) => s.messaging.selectedMessage);
  const threadOverlay = useAppStore((s) => s.threadOverlay);
  const closeThreadOverlay = useAppStore((s) => s.closeThreadOverlay);

  const { data: messages, isLoading } = useMessages(channels, submenu, selectedListings);
  const { markAsRead } = useMessageActions();

  // List view: viewing = right-pane selection. Kanban: viewing = thread
  // overlay open state. Closing the overlay or switching messages should end
  // the viewing session.
  const viewingMessageId =
    view === "kanban" ? (threadOverlay?.open ? threadOverlay.messageId : null) : selectedMessage;

  const viewingStatus = useMemo(() => {
    if (!viewingMessageId || !messages) return null;
    return messages.find((m) => m.id === viewingMessageId)?.status ?? null;
  }, [viewingMessageId, messages]);

  // markAsRead's identity changes each render (its useCallback dep is the
  // mutation object); route through a ref so the cleanup below stays stable.
  const markAsReadRef = useRef(markAsRead);
  useEffect(() => {
    markAsReadRef.current = markAsRead;
  });

  // Mark a message read when the user leaves it: switching to a different
  // message, closing the kanban overlay, or navigating away from the page
  // (component unmount). Re-check status at cleanup time so an explicit Flag
  // during the viewing session isn't overwritten back to read.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  });

  useEffect(() => {
    if (!viewingMessageId || viewingStatus !== "unread") return;
    const id = viewingMessageId;
    return () => {
      const currentStatus = messagesRef.current?.find((m) => m.id === id)?.status;
      if (currentStatus === "unread") {
        markAsReadRef.current(id);
      }
    };
  }, [viewingMessageId, viewingStatus]);

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

  if (isLoading) {
    return (
      <div className="py-xl flex items-center justify-center">
        <p className="text-body text-gray-400">Loading messages...</p>
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
        />
      )}
    </div>
  );
}
