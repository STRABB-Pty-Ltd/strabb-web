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
  /** Optional leading icon, rendered before the label. */
  icon?: ReactNode;
  /** Whether this cell is the event's first day. */
  isEventStart?: boolean;
  /** Whether this cell is the event's last day. */
  isEventEnd?: boolean;
  /** Fraction (0..1) of the cell to leave empty before the chip on the
   *  event's start day — mirrors the calendar gantt's getPartialDay insets. */
  insetStart?: number;
  /** Fraction (0..1) of the cell to leave empty after the chip on the
   *  event's end day. */
  insetEnd?: number;
  /** Whether to render the label on this cell. The grid only marks the
   *  first cell of each event per week, so the label appears once per
   *  booking-per-week and overflows visibly across the cells of the stay
   *  rather than being repeated and truncated in every middle-day cell. */
  showLabel?: boolean;
  onClick: () => void;
}

// Half of the 3px gap between unconjoined chips. Added to each inset edge so
// e.g. a booking ending at 25% and a cleaning starting at 25% leave 3px of
// air between them — applied only when an inset is non-zero, so a regular
// full-day chip sits flush to the cell content edge.
const GAP_HALF = "1.5px";

export function CalendarEventChip({
  label,
  color,
  textColor,
  accentColor,
  icon,
  isEventStart = true,
  isEventEnd = true,
  insetStart = 0,
  insetEnd = 0,
  showLabel = true,
  onClick,
}: CalendarEventChipProps) {
  const cornerClasses = [
    isEventStart ? "rounded-l-lg" : "",
    isEventEnd ? "rounded-r-lg" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const startEdge = isEventStart
    ? insetStart > 0
      ? `calc(${insetStart * 100}% + ${GAP_HALF})`
      : "0"
    : "calc(-1 * var(--space-xs))";
  const endEdge = isEventEnd
    ? insetEnd > 0
      ? `calc(${insetEnd * 100}% + ${GAP_HALF})`
      : "0"
    : "calc(-1 * var(--space-xs) - 1px)";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`px-xs py-xs gap-xs text-body absolute flex items-center text-left ${cornerClasses}`}
      style={{
        backgroundColor: color,
        color: textColor ?? "var(--surface-60)",
        borderLeft: accentColor && isEventStart ? `4px solid ${accentColor}` : undefined,
        borderRight: accentColor && isEventEnd ? `4px solid ${accentColor}` : undefined,
        left: startEdge,
        right: endEdge,
        top: 0,
        bottom: 0,
        // Labeled chips ride above their neighbours so the overflowing
        // text paints over the colour blocks of the middle/end-day cells
        // that share the same booking.
        zIndex: showLabel ? 20 : 10,
        overflow: showLabel ? "visible" : "hidden",
      }}
      title={label}
    >
      {icon && <span className="shrink-0 leading-none">{icon}</span>}
      {showLabel && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
    </button>
  );
}
