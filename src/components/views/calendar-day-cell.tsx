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
  insetStart?: number;
  insetEnd?: number;
  showLabel?: boolean;
  onClick: () => void;
}

interface CalendarDayCellProps {
  date: Date;
  /** Visible track rows. Each row is the array of events on that track for
   *  this day — usually one item, but a turnover day can have three on the
   *  same track (booking-out + cleaning + booking-in) thanks to fractional
   *  cell insets. Empty arrays render as a placeholder track row, keeping a
   *  multi-day event on the same row across every cell it spans. */
  tracks: Array<DayCellEvent[]>;
  isCurrentMonth: boolean;
  /** Number of events in this cell that didn't fit in the visible tracks
   *  (i.e. their assigned track index is beyond the cap). */
  overflowCount?: number;
  compact?: boolean;
}

// Chip height = body font (13px) × line-height (1.615) + 2 × xs padding (5px)
// = ~31px. Hardcoded because the track rows house absolute-positioned chips
// whose top:0 / bottom:0 stretches require an explicit parent height — calc
// against tokens silently collapses to 0 when one of the vars is unitless.
const TRACK_ROW_HEIGHT = "31px";

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
        {tracks.map((trackEvents, i) => (
          <div
            key={i}
            style={{ position: "relative", width: "100%", height: TRACK_ROW_HEIGHT }}
          >
            {trackEvents.map((ev, j) => (
              <CalendarEventChip
                key={j}
                label={ev.label}
                color={ev.color}
                textColor={ev.textColor}
                accentColor={ev.accentColor}
                icon={ev.icon}
                isEventStart={ev.isEventStart}
                isEventEnd={ev.isEventEnd}
                insetStart={ev.insetStart}
                insetEnd={ev.insetEnd}
                showLabel={ev.showLabel}
                onClick={ev.onClick}
              />
            ))}
          </div>
        ))}
        {overflowCount > 0 && (
          <span className="mt-xs text-body text-gray-400">+{overflowCount} more</span>
        )}
      </div>
    </div>
  );
}
