"use client";

interface GanttBarProps {
  label: string;
  color: string;
  textColor?: string;
  /** Optional 4px coloured stripe down the left edge — used by the calendar
   *  gantt to flag a booking's channel (Airbnb / Booking.com / Vrbo / direct)
   *  the same way the messaging cards do. */
  accentColor?: string;
  leftPx: number;
  widthPx: number;
  rowHeight: number;
  onClick: () => void;
}

export function GanttBar({
  label,
  color,
  textColor,
  accentColor,
  leftPx,
  widthPx,
  rowHeight,
  onClick,
}: GanttBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-body absolute flex items-center justify-center overflow-hidden rounded-sm text-center break-words"
      title={label}
      style={{
        left: leftPx,
        width: widthPx,
        height: rowHeight,
        top: 0,
        backgroundColor: color,
        color: textColor ?? "var(--surface-60)",
        borderLeft: accentColor ? `4px solid ${accentColor}` : undefined,
        borderRadius: 3,
        padding: "2px 5px",
        lineHeight: 1.25,
      }}
    >
      {label}
    </button>
  );
}
