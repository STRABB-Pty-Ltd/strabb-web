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
  const conversationActionSignal = useAppStore((s) => s.conversationActionSignal);

  const { data: messages, isLoading } = useMessages(channels, submenu, selectedListings);
  const { markAsRead, markAsUnread } = useMessageActions();

  // List view: viewing = right-pane selection. Kanban: viewing = thread
  // overlay open state. Closing the overlay or switching messages ends the
  // viewing session.
  const viewingMessageId =
    view === "kanban" ? (threadOverlay?.open ? threadOverlay.messageId : null) : selectedMessage;

  // markAsRead/markAsUnread identities change each render (their useCallback
  // dep is the mutation object); route through refs so the open effect can
  // depend only on the viewed id. messagesRef gives the open effect the live
  // status without re-running it on every status change. actionNonceRef tracks
  // the latest host-action pulse so the timer can be armed against a baseline.
  const markAsReadRef = useRef(markAsRead);
  const markAsUnreadRef = useRef(markAsUnread);
  const messagesRef = useRef(messages);
  const actionNonceRef = useRef(conversationActionSignal?.nonce ?? 0);
  useEffect(() => {
    markAsReadRef.current = markAsRead;
    markAsUnreadRef.current = markAsUnread;
    messagesRef.current = messages;
    actionNonceRef.current = conversationActionSignal?.nonce ?? 0;
  });

  // Read-on-open with a grace window. Opening a conversation that was unread
  // marks it read immediately, then arms a timer that reverts it to unread
  // after REPLY_GRACE_MS so it stays on the radar. The revert is cancelled if
  // the host actions the conversation (reply/flag/archive/convert) within the
  // window, or if they leave (cleanup). Read/flagged/archived conversations
  // are left untouched on open.
  const revertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armedNonceRef = useRef(0);
  useEffect(() => {
    if (!viewingMessageId) return;
    const id = viewingMessageId;
    const openStatus = messagesRef.current?.find((m) => m.id === id)?.status;
    if (openStatus !== "unread") return;
    markAsReadRef.current(id);
    armedNonceRef.current = actionNonceRef.current;
    revertTimerRef.current = setTimeout(() => {
      markAsUnreadRef.current(id);
      revertTimerRef.current = null;
    }, REPLY_GRACE_MS);
    return () => {
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
      revertTimerRef.current = null;
    };
  }, [viewingMessageId]);

  // A host action on the viewed conversation cancels its pending revert. The
  // nonce-baseline guard ignores a stale signal carried over from an earlier
  // session, so reopening a re-unread conversation still reverts.
  useEffect(() => {
    if (!conversationActionSignal || !revertTimerRef.current) return;
    if (
      conversationActionSignal.conversationId === viewingMessageId &&
      conversationActionSignal.nonce > armedNonceRef.current
    ) {
      clearTimeout(revertTimerRef.current);
      revertTimerRef.current = null;
    }
  }, [conversationActionSignal, viewingMessageId]);

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
