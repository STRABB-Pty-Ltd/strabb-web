"use client";

import { Wrench } from "lucide-react";

import { usePropertyTimezone } from "@/hooks/use-property-timezone";
import { formatInPropertyTimezone } from "@/lib/date-utils";
import type { Ticket } from "@/types/ticket";

const priorityColors: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  high: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  medium: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
  low: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
};

const statusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

interface TicketKanbanCardProps {
  ticket: Ticket;
  propertyName?: string;
  onClick: () => void;
}

export function TicketKanbanCard({ ticket, propertyName, onClick }: TicketKanbanCardProps) {
  const tz = usePropertyTimezone(ticket.propertyId);
  const priority = priorityColors[ticket.priority] ?? priorityColors.low;

  return (
    <button type="button" onClick={onClick} className="w-full text-left" data-no-elevate>
      <div className="space-y-xs">
        <div className="gap-xs flex items-center">
          <Wrench size={12} className="text-highlight-10 shrink-0" />
          <span className="text-body text-highlight-10 truncate font-medium">
            {propertyName ?? ticket.propertyId.slice(0, 8)}
          </span>
        </div>

        <p className="text-body text-highlight-10 line-clamp-2">{ticket.description}</p>

        <div className="gap-base flex items-center">
          <span
            className="px-xs py-xs text-body rounded-sm font-medium"
            style={{ backgroundColor: priority.bg, color: priority.text }}
          >
            {ticket.priority}
          </span>
          <span
            className="px-xs py-xs text-body rounded-sm font-medium"
            style={{
              backgroundColor: statusColors[ticket.status] ?? "var(--highlight-10)",
              color: "var(--surface-60)",
            }}
          >
            {ticket.status}
          </span>
        </div>

        <div className="text-body text-highlight-10">
          Reported {formatInPropertyTimezone(ticket.dateReported, tz, "d MMM")}
        </div>
      </div>
    </button>
  );
}
