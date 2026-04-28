"use client";

import { isToday } from "date-fns";
import type { ReactNode } from "react";

import { CalendarEventChip } from "./calendar-event-chip";

interface DayCellEvent {
  label: string;
  color: string;
  textColor?: string;
  accentColor?: string;
  icon?: ReactNode;
  isEventStart?: boolean;
  isEventEnd?: boolean;
  onClick: () => void;
}

interface CalendarDayCellProps {
  date: Date;
  /** Visible track slots in row order. A null entry renders an invisible
   *  placeholder that occupies the same vertical space as a chip — this
   *  keeps a multi-day event on the same row across every cell it spans. */
  tracks: Array<DayCellEvent | null>;
  isCurrentMonth: boolean;
  /** Number of events in this cell that didn't fit in the visible tracks
   *  (i.e. their assigned track index is beyond the cap). */
  overflowCount?: number;
  compact?: boolean;
}

export function CalendarDayCell({
  date,
  tracks,
  isCurrentMonth,
  overflowCount = 0,
  compact = false,
}: CalendarDayCellProps) {
  const today = isToday(date);

  return (
    <div
      className="flex flex-col border-r border-b"
      style={{
        minHeight: compact ? 55 : 89,
        borderColor: "var(--border)",
        backgroundColor: today ? "var(--neutral-30)" : "var(--surface-60)",
        opacity: isCurrentMonth ? 1 : 0.4,
        padding: "var(--space-xs)",
      }}
    >
      <span
        className="mb-xs text-body font-medium"
        style={{
          color: today
            ? "var(--strabb-secondary)"
            : isCurrentMonth
              ? "var(--brand-10)"
              : "var(--brand-10)",
          fontWeight: today ? 700 : 500,
        }}
      >
        {date.getDate()}
      </span>
      <div className="gap-xs flex flex-col">
        {tracks.map((slot, i) =>
          slot ? (
            <CalendarEventChip
              key={i}
              label={slot.label}
              color={slot.color}
              textColor={slot.textColor}
              accentColor={slot.accentColor}
              icon={slot.icon}
              isEventStart={slot.isEventStart}
              isEventEnd={slot.isEventEnd}
              onClick={slot.onClick}
            />
          ) : (
            <div
              key={i}
              aria-hidden="true"
              className="px-xs py-xs text-body invisible"
            >
              &nbsp;
            </div>
          ),
        )}
        {overflowCount > 0 && (
          <span className="mt-xs text-body text-gray-400">+{overflowCount} more</span>
        )}
      </div>
    </div>
  );
}
