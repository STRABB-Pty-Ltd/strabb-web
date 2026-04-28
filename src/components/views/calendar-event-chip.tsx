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
   *  first cell of each event per week, so a multi-day booking shows its
   *  name once per week segment instead of repeating it in every cell. */
  showLabel?: boolean;
  /** Optional CSS max-width for the label, expressed as a percentage of
   *  the chip's own content area. The grid sizes it to the cells the bar
   *  has left in this week minus any next-on-track collision, so the
   *  label gets to overflow rightward across middle days of a multi-day
   *  bar but uses an ellipsis when the text would run past the bar's
   *  end (or kiss the next event's chip). */
  labelMaxWidth?: string;
  /** When true, suppress the left-extension that normally connects a
   *  continuing chip to yesterday's. Used for chips in the first column
   *  of a week so they don't bleed against the grid's outer left border
   *  with no previous chip to fuse into. */
  clampLeftEdge?: boolean;
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
  labelMaxWidth,
  clampLeftEdge = false,
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
    : clampLeftEdge
      ? "0"
      : "calc(-1 * var(--space-xs))";
  const endEdge = isEventEnd
    ? insetEnd > 0
      ? `calc(${insetEnd * 100}% + ${GAP_HALF})`
      : "0"
    : // -5 px padding + -2 px border so the chip's right edge reaches
      // the cell's outer-right line and paints over the 2 px cell border,
      // letting adjacent days' chips fuse into a continuous bar.
      "calc(-1 * var(--space-xs) - 2px)";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`gap-xs text-body absolute flex items-center text-left ${cornerClasses}`}
      style={{
        backgroundColor: color,
        color: textColor ?? "var(--surface-60)",
        borderLeft: accentColor && isEventStart ? `4px solid ${accentColor}` : undefined,
        borderRight: accentColor && isEventEnd ? `4px solid ${accentColor}` : undefined,
        // Pad on the side that's actually a chip edge so the label has
        // breathing room from the bg edge. Mid-row continuation chips
        // skip padding-left so their label sits flush with yesterday's
        // chip's overflowing label, but a continuation that's been
        // clamped to the start of a row (no chip to fuse into) gets the
        // padding back so its label doesn't kiss the chip's left bg edge.
        paddingLeft: isEventStart || clampLeftEdge ? "var(--space-xs)" : 0,
        paddingRight: isEventEnd ? "var(--space-xs)" : 0,
        // Tight vertical padding so 5+ rows of cells fit a typical canvas
        // without scrolling — the body line-height already provides
        // breathing space around the text.
        paddingTop: 1,
        paddingBottom: 1,
        left: startEdge,
        right: endEdge,
        top: 0,
        bottom: 0,
        // Labeled chips ride above their neighbours and let their text
        // overflow rightward across the rest of the bar — the label is
        // anchored to the chip's own left edge (the bar's start) and
        // simply paints over the colour blocks of the trailing days.
        overflow: showLabel ? "visible" : "hidden",
        zIndex: showLabel ? 20 : 10,
      }}
      title={label}
    >
      {icon && <span className="shrink-0 leading-none">{icon}</span>}
      {showLabel && (
        <span
          style={{
            // flex-shrink: 0 stops the chip's flex layout from squashing
            // the label down to the chip's narrow content area. The label
            // keeps its content width (subject to max-width) so it can
            // overflow rightward across the rest of the bar via the chip's
            // overflow: visible.
            flexShrink: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: labelMaxWidth,
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
