"use client";

import { Wrench } from "lucide-react";

import { usePropertyTimezone } from "@/hooks/use-property-timezone";
import { formatInPropertyTimezone } from "@/lib/date-utils";
import { formatEnumLabel } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";

const priorityColors: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  high: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  medium: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
  low: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
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
          <Wrench size={12} className="text-highlight-10 shrink-0" aria-hidden="true" />
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
            {formatEnumLabel(ticket.priority)}
          </span>
        </div>

        <div className="text-body text-highlight-10">
          Reported {formatInPropertyTimezone(ticket.dateReported, tz, "d MMM")}
        </div>
      </div>
    </button>
  );
}
