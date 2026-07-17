"use client";

import type { ReactNode } from "react";

interface GanttBarProps {
  label: string;
  color: string;
  textColor?: string;
  /** Optional 4px coloured stripe down the left edge - used by the calendar
   *  gantt to flag a booking's channel (Airbnb / Booking.com / Vrbo / direct)
   *  the same way the messaging cards do. */
  accentColor?: string;
  /** Optional icon rendered before the label (shrink-0 so it won't compress
   *  when the bar is narrow). Used by the calendar gantt to swap the word
   *  "Turnover" for a broom icon on cleaning bars. */
  icon?: ReactNode;
  leftPx: number;
  widthPx: number;
  rowHeight: number;
  /** Number of rows this bar visually spans. When > 1 the bar overflows its
   *  anchor row's container, so it needs a higher z-index to paint over the
   *  day cells of subsequent rows below. Default 1. */
  spans?: number;
  /** When true the bar renders as a non-interactive "implicit block": muted
   *  fill, diagonal stripe overlay, no label, no click. Used by the calendar
   *  gantt to show that a parent booking blocks its children (and vice
   *  versa) on rows that don't carry the booking itself. */
  isBlocked?: boolean;
  onClick: () => void;
}

// Mirrors the text-body class (--text-body, globals.css) and baseStyle's own
// lineHeight below - kept as constants (not read from the DOM) so the
// max-lines math stays in lockstep with whatever actually renders.
const LABEL_FONT_SIZE = 13;
const LABEL_LINE_HEIGHT = 1.25;
// = baseStyle.padding's top+bottom ("2px 5px").
const VERTICAL_PADDING = 4;

export function GanttBar({
  label,
  color,
  textColor,
  accentColor,
  icon,
  leftPx,
  widthPx,
  rowHeight,
  spans = 1,
  isBlocked = false,
  onClick,
}: GanttBarProps) {
  const baseStyle = {
    left: leftPx,
    width: widthPx,
    height: rowHeight,
    top: 0,
    backgroundColor: color,
    color: textColor ?? "var(--surface-60)",
    borderLeft: accentColor && !isBlocked ? `var(--stripe-width) solid ${accentColor}` : undefined,
    padding: "2px 5px",
    lineHeight: 1.25,
    // Multi-row bars sit above adjacent day cells. Blocked shadows sit at
    // z-index 0 so any real booking/cleaning on the same row (auto stack,
    // rendered later in DOM order) paints on top.
    zIndex: spans > 1 ? 6 : isBlocked ? 0 : undefined,
  };

  // Clamp the label to however many lines actually fit this bar's height
  // (taller for rowSpan'd parent-listing bars) instead of hard-wrapping with
  // overflow:hidden - long free text (ticket descriptions especially) was
  // wrapping to 6+ lines and getting silently cut off mid-word with nothing
  // visible past the row's edge. Ellipsis on the last visible line instead.
  const maxLines = Math.max(
    1,
    Math.floor((rowHeight - VERTICAL_PADDING) / (LABEL_FONT_SIZE * LABEL_LINE_HEIGHT)),
  );

  if (isBlocked) {
    return (
      <div
        aria-hidden="true"
        className="absolute overflow-hidden rounded-lg"
        style={{
          ...baseStyle,
          backgroundColor: "var(--neutral-30)",
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--highlight-10) 0, var(--highlight-10) 4px, transparent 4px, transparent 10px)",
          opacity: 0.6,
          pointerEvents: "none",
          cursor: "default",
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-body gap-xs absolute flex items-center justify-center overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
      title={label}
      style={baseStyle}
    >
      {icon && <span className="shrink-0 leading-none">{icon}</span>}
      {label && (
        <span
          className="text-center break-words"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
