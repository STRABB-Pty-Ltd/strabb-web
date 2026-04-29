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
  labelMaxWidth?: string;
  clampLeftEdge?: boolean;
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
  /** Suppress the right border (cell is the rightmost in its row, so the
   *  border would land on the calendar's outer edge). */
  isLastColumn?: boolean;
  /** Suppress the bottom border (cell is in the last row, so the border
   *  would land on the calendar's outer edge). */
  isLastRow?: boolean;
}

// Chip height = body font (13px) × line-height (1.615) ≈ 21 px + 2 × 1 px
// vertical padding ≈ 23 px. Tight on purpose so 5+ rows of cells fit a typical
// canvas without scrolling. Hardcoded because the track rows house absolute-
// positioned chips whose top:0 / bottom:0 stretches require an explicit
// parent height — calc against unitless tokens silently collapses to 0.
const TRACK_ROW_HEIGHT = "23px";

export function CalendarDayCell({
  date,
  tracks,
  isCurrentMonth,
  overflowCount = 0,
  isLastColumn = false,
  isLastRow = false,
}: CalendarDayCellProps) {
  const today = isToday(date);

  return (
    <div
      className="flex flex-col"
      style={{
        backgroundColor: "var(--surface-60)",
        opacity: isCurrentMonth ? 1 : 0.4,
        // Tight top + bottom so the date number and +N more line don't
        // burn vertical space; horizontal padding stays at the xs token
        // so chips' negative-margin extensions still hit the right edge.
        paddingTop: 2,
        paddingRight: "var(--space-xs)",
        paddingBottom: 2,
        paddingLeft: "var(--space-xs)",
        borderRight: isLastColumn ? undefined : "2px solid var(--neutral-30)",
        borderBottom: isLastRow ? undefined : "2px solid var(--neutral-30)",
        // Today gets a 3 px brand outline on all four sides — including
        // the outer edges (breaking the no-outside-border rule). Drawn
        // inside the cell via outline-offset so it doesn't shift layout,
        // and lifted with position/z-index so it paints above the grey
        // grid lines and any chips extending in from neighbouring cells.
        outline: today ? "3px solid var(--brand-10)" : undefined,
        outlineOffset: today ? "-3px" : undefined,
        position: today ? "relative" : undefined,
        zIndex: today ? 100 : undefined,
      }}
    >
      <span
        className="text-body font-medium"
        style={{
          color: today
            ? "var(--strabb-secondary)"
            : isCurrentMonth
              ? "var(--brand-10)"
              : "var(--brand-10)",
          fontWeight: today ? 700 : 500,
          // Tight margin between date and first track row.
          marginBottom: 2,
        }}
      >
        {date.getDate()}
      </span>
      <div className="gap-xs flex flex-col">
        {tracks.map((trackEvents, i) => (
          <div key={i} style={{ position: "relative", width: "100%", height: TRACK_ROW_HEIGHT }}>
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
                labelMaxWidth={ev.labelMaxWidth}
                clampLeftEdge={ev.clampLeftEdge}
                onClick={ev.onClick}
              />
            ))}
          </div>
        ))}
        {overflowCount > 0 && (
          <span className="text-body text-gray-400" style={{ marginTop: 2 }}>
            +{overflowCount} more
          </span>
        )}
      </div>
    </div>
  );
}
