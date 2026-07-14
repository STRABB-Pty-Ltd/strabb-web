"use client";

import { Chip } from "@/components/ui/chip";
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
          <span className="text-body text-highlight-10 truncate font-medium">
            {propertyName ?? ticket.propertyId.slice(0, 8)}
          </span>
        </div>

        <p className="text-body text-highlight-10 line-clamp-2">{ticket.description}</p>

        <div className="gap-base flex items-center">
          <Chip tone="solid" size="xs" radius="sm" color={priority.bg} textColor={priority.text}>
            {formatEnumLabel(ticket.priority)}
          </Chip>
        </div>

        <div className="text-body text-highlight-10">
          Reported {formatInPropertyTimezone(ticket.dateReported, tz, "d MMM")}
        </div>
      </div>
    </button>
  );
}
