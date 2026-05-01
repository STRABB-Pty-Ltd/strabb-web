"use client";

import { format, isToday } from "date-fns";
import { useEffect, useRef, useState, type ReactNode } from "react";

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

interface OverflowEvent {
  label: string;
  color: string;
  onClick: () => void;
}

interface CalendarDayCellProps {
  date: Date;
  /** Visible track rows. Each row is the array of events on that track for
   *  this day - usually one item, but a turnover day can have three on the
   *  same track (booking-out + cleaning + booking-in) thanks to fractional
   *  cell insets. Empty arrays render as a placeholder track row, keeping a
   *  multi-day event on the same row across every cell it spans. */
  tracks: Array<DayCellEvent[]>;
  isCurrentMonth: boolean;
  /** Events on this day that didn't fit in the visible tracks. Surfaced via
   *  the "+N more" trigger which opens a popover listing them. */
  overflowEvents?: OverflowEvent[];
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
// parent height - calc against unitless tokens silently collapses to 0.
const TRACK_ROW_HEIGHT = "23px";

export function CalendarDayCell({
  date,
  tracks,
  isCurrentMonth,
  overflowEvents = [],
  isLastColumn = false,
  isLastRow = false,
}: CalendarDayCellProps) {
  const today = isToday(date);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  // Click-outside + Escape closes the overflow popover.
  useEffect(() => {
    if (!overflowOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverflowOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [overflowOpen]);

  return (
    <div
      className="flex flex-col"
      style={{
        backgroundColor: "var(--surface-60)",
        // Tight top + bottom so the date number and +N more line don't
        // burn vertical space; horizontal padding stays at the xs token
        // so chips' negative-margin extensions still hit the right edge.
        paddingTop: 2,
        paddingRight: "var(--space-xs)",
        paddingBottom: 2,
        paddingLeft: "var(--space-xs)",
        borderRight: isLastColumn ? undefined : "2px solid var(--neutral-30)",
        borderBottom: isLastRow ? undefined : "2px solid var(--neutral-30)",
        // Today gets a 3 px brand outline on all four sides - including
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
          opacity: isCurrentMonth ? 1 : 0.4,
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
        {overflowEvents.length > 0 && (
          <div ref={overflowRef} style={{ position: "relative", marginTop: 2 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOverflowOpen((v) => !v);
              }}
              className="text-body text-left text-gray-500 hover:text-gray-700"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              +{overflowEvents.length} more
            </button>
            {overflowOpen && (
              <div
                className="p-sm gap-xs flex flex-col rounded-lg"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  zIndex: 200,
                  minWidth: 200,
                  maxWidth: 280,
                  backgroundColor: "var(--surface-60)",
                  boxShadow: "0 6px 24px rgba(0, 0, 0, 0.15)",
                  border: "1px solid var(--neutral-30)",
                }}
                role="dialog"
                aria-label={`Events on ${format(date, "d MMM yyyy")}`}
              >
                <p
                  className="text-body font-semibold"
                  style={{ color: "var(--brand-10)", marginBottom: 2 }}
                >
                  {format(date, "EEE d MMM")}
                </p>
                {overflowEvents.map((ev, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverflowOpen(false);
                      ev.onClick();
                    }}
                    className="gap-xs px-xs py-xs text-body flex items-center rounded-md text-left hover:bg-gray-100"
                    style={{ color: "var(--brand-10)", background: "none", border: "none" }}
                  >
                    <span
                      className="shrink-0 rounded-full"
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: ev.color,
                      }}
                    />
                    <span className="truncate">{ev.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
