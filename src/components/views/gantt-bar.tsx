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
  onClick: () => void;
}

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
  onClick,
}: GanttBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-body gap-xs absolute flex items-center justify-center overflow-hidden rounded-lg text-center break-words"
      title={label}
      style={{
        left: leftPx,
        width: widthPx,
        height: rowHeight,
        top: 0,
        backgroundColor: color,
        color: textColor ?? "var(--surface-60)",
        borderLeft: accentColor ? `4px solid ${accentColor}` : undefined,
        padding: "2px 5px",
        lineHeight: 1.25,
        // Multi-row bars need to sit above the next rows' day cells (which
        // would otherwise paint over them via document order). Today line
        // uses z-index 8 so stay below that.
        zIndex: spans > 1 ? 6 : undefined,
      }}
    >
      {icon && <span className="shrink-0 leading-none">{icon}</span>}
      {label && <span>{label}</span>}
    </button>
  );
}
