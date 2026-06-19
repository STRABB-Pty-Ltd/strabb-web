"use client";

import { useEffect, useRef } from "react";

import { ThreadOverlay } from "@/components/overlays/thread-overlay";
import { Skeleton } from "@/components/ui/skeleton";
import { MessagingKanbanView } from "./_components/messaging-kanban-view";
import { MessagingListView } from "./_components/messaging-list-view";
import { useMessages, useMessageActions, useMessageThread } from "@/hooks/use-messaging";
import { useAppStore } from "@/stores/app-store";

// Grace window after opening an unread conversation: if the host hasn't
// replied within this, it reverts to unread so it stays on the radar.
const REPLY_GRACE_MS = 5000;

export default function MessagingPage() {
  const view = useAppStore((s) => s.messaging.view);
  const submenu = useAppStore((s) => s.messaging.submenu);
  const channels = useAppStore((s) => s.messaging.channels);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const selectedMessage = useAppStore((s) => s.messaging.selectedMessage);
  const threadOverlay = useAppStore((s) => s.threadOverlay);
  const closeThreadOverlay = useAppStore((s) => s.closeThreadOverlay);
  const replySignal = useAppStore((s) => s.replySignal);

  const { data: messages, isLoading } = useMessages(channels, submenu, selectedListings);
  const { markAsRead, markAsUnread } = useMessageActions();

  // List view: viewing = right-pane selection. Kanban: viewing = thread
  // overlay open state. Closing the overlay or switching messages ends the
  // viewing session.
  const viewingMessageId =
    view === "kanban" ? (threadOverlay?.open ? threadOverlay.messageId : null) : selectedMessage;

  // markAsRead/markAsUnread identities change each render (their useCallback
  // dep is the mutation object); route through refs so the open effect can
  // depend only on the viewed id. messagesRef gives both effects the live
  // status without re-running them on every status change.
  const markAsReadRef = useRef(markAsRead);
  const markAsUnreadRef = useRef(markAsUnread);
  const messagesRef = useRef(messages);
  useEffect(() => {
    markAsReadRef.current = markAsRead;
    markAsUnreadRef.current = markAsUnread;
    messagesRef.current = messages;
  });

  // Read-on-open with a reply grace window. Opening a conversation that was
  // unread marks it read immediately; if the host doesn't reply within
  // REPLY_GRACE_MS it reverts to unread. Read/flagged/archived conversations
  // are left untouched, and an explicit Flag/Archive during the session is
  // never clobbered. Leaving before the window elapses keeps it read.
  const revertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!viewingMessageId) return;
    const id = viewingMessageId;
    const openStatus = messagesRef.current?.find((m) => m.id === id)?.status;
    if (openStatus !== "unread") return;
    markAsReadRef.current(id);
    revertTimerRef.current = setTimeout(() => {
      if (messagesRef.current?.find((m) => m.id === id)?.status === "read") {
        markAsUnreadRef.current(id);
      }
      revertTimerRef.current = null;
    }, REPLY_GRACE_MS);
    return () => {
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
      revertTimerRef.current = null;
    };
  }, [viewingMessageId]);

  // A host reply (any view) cancels the pending revert for that conversation.
  useEffect(() => {
    if (!replySignal || !revertTimerRef.current) return;
    if (replySignal.conversationId === viewingMessageId) {
      clearTimeout(revertTimerRef.current);
      revertTimerRef.current = null;
    }
  }, [replySignal, viewingMessageId]);

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
        />
      )}
    </div>
  );
}
