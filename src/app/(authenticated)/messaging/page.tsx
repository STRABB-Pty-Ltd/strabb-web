"use client";

import { CalendarClock } from "lucide-react";
import Link from "next/link";

import { ThreadOverlay } from "@/components/overlays/thread-overlay";
import { MessagingKanbanView } from "@/components/pages/messaging/messaging-kanban-view";
import { MessagingListView } from "@/components/pages/messaging/messaging-list-view";
import { useMessages, useMessageThread } from "@/hooks/use-messaging";
import { useAppStore } from "@/stores/app-store";

export default function MessagingPage() {
  const view = useAppStore((s) => s.messaging.view);
  const submenu = useAppStore((s) => s.messaging.submenu);
  const channels = useAppStore((s) => s.messaging.channels);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const threadOverlay = useAppStore((s) => s.threadOverlay);
  const closeThreadOverlay = useAppStore((s) => s.closeThreadOverlay);

  const { data: messages, isLoading } = useMessages(channels, submenu, selectedListings);

  const threadMsg = threadOverlay
    ? (messages ?? []).find((m) => m.id === threadOverlay.messageId)
    : null;
  const { data: threadMessages } = useMessageThread(threadOverlay?.messageId ?? null);

  const headerLink = (
    <div className="mb-sm flex justify-end">
      <Link
        href="/messaging/scheduled"
        className="gap-xs px-sm py-xs text-body inline-flex items-center rounded-lg border font-medium text-gray-700 hover:bg-gray-50"
        style={{ borderColor: "var(--border)" }}
      >
        <CalendarClock size={14} />
        Scheduled messages
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {headerLink}
        <div className="py-xl flex items-center justify-center">
          <p className="text-body text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {headerLink}
      {view === "kanban" && <MessagingKanbanView messages={messages ?? []} />}
      {view === "list" && <MessagingListView messages={messages ?? []} />}

      {threadMsg && threadOverlay?.open && (
        <ThreadOverlay
          open
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
