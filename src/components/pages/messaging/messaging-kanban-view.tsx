"use client";

import { KanbanBoard } from "@/components/views/kanban-board";
import { useMessageActions } from "@/hooks/use-messaging";
import type { Message } from "@/types/message";
import { useAppStore } from "@/stores/app-store";

import { MessageCard } from "./message-card";

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

const statusColumns = [
  { id: "unread", label: "Unread" },
  { id: "flagged", label: "Flagged" },
  { id: "read", label: "Read" },
  { id: "archived", label: "Archived" },
];

interface MessagingKanbanViewProps {
  messages: Message[];
}

export function MessagingKanbanView({ messages }: MessagingKanbanViewProps) {
  const { localUpdates } = useMessageActions();
  const setSelectedMessage = useAppStore((s) => s.setSelectedMessage);
  const openThreadOverlay = useAppStore((s) => s.openThreadOverlay);

  const getEffectiveStatus = (msg: Message) =>
    localUpdates[msg.id]?.status ?? msg.status;

  const columns = statusColumns.map((col) => ({
    ...col,
    items: messages.filter((m) => getEffectiveStatus(m) === col.id),
  }));

  return (
    <KanbanBoard<Message>
      columns={columns}
      renderCard={(msg) => (
        <MessageCard
          message={msg}
          onClick={() => {
            setSelectedMessage(msg.id);
            openThreadOverlay(msg.id);
          }}
        />
      )}
      getItemId={(msg) => msg.id}
      getBorderColor={(msg) => channelColors[msg.channel] ?? "#6B7280"}
    />
  );
}
