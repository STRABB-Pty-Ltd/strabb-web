"use client";

import { Wrench } from "lucide-react";

import { usePropertyTimezone } from "@/hooks/use-property-timezone";
import { formatInPropertyTimezone } from "@/lib/date-utils";
import type { Ticket } from "@/types/ticket";

const priorityColors: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  high: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  medium: { bg: "var(--neutral-30)", text: "var(--brand-10)" },
  low: { bg: "var(--neutral-30)", text: "var(--brand-10)" },
};

const statusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  completed: "var(--status-completed)",
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
    <button type="button" onClick={onClick} className="w-full text-left">
      <div className="space-y-xs">
        <div className="gap-xs flex items-center">
          <Wrench size={12} className="shrink-0 text-gray-500" />
          <span className="text-body truncate font-medium text-gray-800">
            {propertyName ?? ticket.propertyId.slice(0, 8)}
          </span>
        </div>

        <p className="text-body line-clamp-2 text-gray-700">{ticket.description}</p>

        <div className="gap-base flex items-center">
          <span
            className="px-xs py-xs text-body rounded-sm font-medium"
            style={{ backgroundColor: priority.bg, color: priority.text }}
          >
            {ticket.priority}
          </span>
          <span
            className="px-xs py-xs text-body rounded-sm font-medium text-white"
            style={{ backgroundColor: statusColors[ticket.status] ?? "var(--brand-10)" }}
          >
            {ticket.status}
          </span>
        </div>

        <div className="text-body text-gray-500">
          Reported {formatInPropertyTimezone(ticket.dateReported, tz, "d MMM")}
        </div>
      </div>
    </button>
  );
}
