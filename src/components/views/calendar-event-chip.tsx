"use client";

import type { ReactNode } from "react";

interface CalendarEventChipProps {
  label: string;
  color: string;
  textColor?: string;
  /** Optional coloured stripe used to flag a booking's channel. Renders only
   *  on the side that's an event boundary — left when isEventStart, right
   *  when isEventEnd. Mid-event days get no stripe so the chip reads as a
   *  continuous bar across cells. */
  accentColor?: string;
  /** Optional leading icon, rendered before the label. Used by the cleaning /
   *  calendar grids to swap the word "Turnover" for a broom icon, mirroring
   *  the calendar gantt's cleaning bars. */
  icon?: ReactNode;
  /** Whether this cell is the event's first day. When false the chip's left
   *  edge squares off and pushes through the cell's left padding so it reads
   *  as a continuation of yesterday's chip. Defaults to true. */
  isEventStart?: boolean;
  /** Whether this cell is the event's last day. When false the chip's right
   *  edge squares off and pushes through the cell's right padding. Defaults
   *  to true. */
  isEventEnd?: boolean;
  onClick: () => void;
}

export function CalendarEventChip({
  label,
  color,
  textColor,
  accentColor,
  icon,
  isEventStart = true,
  isEventEnd = true,
  onClick,
}: CalendarEventChipProps) {
  const cornerClasses = [
    isEventStart ? "rounded-l-lg" : "",
    isEventEnd ? "rounded-r-lg" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`px-xs py-xs gap-xs text-body flex items-center self-stretch text-left ${cornerClasses}`}
      style={{
        backgroundColor: color,
        color: textColor ?? "var(--surface-60)",
        borderLeft: accentColor && isEventStart ? `4px solid ${accentColor}` : undefined,
        borderRight: accentColor && isEventEnd ? `4px solid ${accentColor}` : undefined,
        marginLeft: isEventStart ? undefined : "calc(-1 * var(--space-xs))",
        marginRight: isEventEnd ? undefined : "calc(-1 * var(--space-xs) - 1px)",
      }}
      title={label}
    >
      {icon && <span className="shrink-0 leading-none">{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
}
