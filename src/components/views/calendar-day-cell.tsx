"use client";

import { isToday } from "date-fns";

import { CalendarEventChip } from "./calendar-event-chip";

interface DayCellEvent {
  label: string;
  color: string;
  onClick: () => void;
}

interface CalendarDayCellProps {
  date: Date;
  events: DayCellEvent[];
  isCurrentMonth: boolean;
  maxEvents?: number;
  compact?: boolean;
}

export function CalendarDayCell({
  date,
  events,
  isCurrentMonth,
  maxEvents = 3,
  compact = false,
}: CalendarDayCellProps) {
  const today = isToday(date);
  const visibleEvents = events.slice(0, maxEvents);
  const overflow = events.length - maxEvents;

  return (
    <div
      className="flex flex-col border-r border-b"
      style={{
        minHeight: compact ? 60 : 100,
        borderColor: "var(--border)",
        backgroundColor: today ? "rgba(59, 130, 246, 0.04)" : "white",
        opacity: isCurrentMonth ? 1 : 0.4,
        padding: "var(--space-xs)",
      }}
    >
      <span
        className="mb-1 text-xs font-medium"
        style={{
          color: today ? "var(--strabb-secondary)" : isCurrentMonth ? "#374151" : "#9CA3AF",
          fontWeight: today ? 700 : 500,
        }}
      >
        {date.getDate()}
      </span>
      <div className="flex flex-col gap-0.5">
        {visibleEvents.map((ev, i) => (
          <CalendarEventChip key={i} label={ev.label} color={ev.color} onClick={ev.onClick} />
        ))}
        {overflow > 0 && <span className="mt-0.5 text-xs text-gray-400">+{overflow} more</span>}
      </div>
    </div>
  );
}
