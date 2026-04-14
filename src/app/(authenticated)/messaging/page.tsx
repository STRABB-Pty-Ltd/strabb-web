"use client";

import { ThreadOverlay } from "@/components/overlays/thread-overlay";
import { MessagingKanbanView } from "@/components/pages/messaging/messaging-kanban-view";
import { MessagingListView } from "@/components/pages/messaging/messaging-list-view";
import { useMessages, useMessageThread } from "@/hooks/use-messaging";
import { mockMessageList } from "@/lib/mock-data";
import { useAppStore } from "@/stores/app-store";

export default function MessagingPage() {
  const view = useAppStore((s) => s.messaging.view);
  const submenu = useAppStore((s) => s.messaging.submenu);
  const channels = useAppStore((s) => s.messaging.channels);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const threadOverlay = useAppStore((s) => s.threadOverlay);
  const closeThreadOverlay = useAppStore((s) => s.closeThreadOverlay);

  const { data: messages, isLoading } = useMessages(
    channels,
    submenu,
    selectedListings,
  );

  const threadMsg = threadOverlay
    ? mockMessageList.find((m) => m.id === threadOverlay.messageId)
    : null;
  const { data: threadMessages } = useMessageThread(
    threadOverlay?.messageId ?? null,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {view === "kanban" && <MessagingKanbanView messages={messages} />}
      {view === "list" && <MessagingListView messages={messages} />}

      {threadMsg && threadOverlay?.open && (
        <ThreadOverlay
          open
          onClose={closeThreadOverlay}
          guestName={threadMsg.guestName}
          listingName={threadMsg.listingName}
          checkIn={threadMsg.checkIn}
          checkOut={threadMsg.checkOut}
          channel={threadMsg.channel}
          messages={threadMessages}
        />
      )}
    </div>
  );
}
