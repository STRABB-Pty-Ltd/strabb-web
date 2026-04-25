"use client";

interface GanttBarProps {
  label: string;
  color: string;
  textColor?: string;
  leftPx: number;
  widthPx: number;
  rowHeight: number;
  onClick: () => void;
}

export function GanttBar({
  label,
  color,
  textColor,
  leftPx,
  widthPx,
  rowHeight,
  onClick,
}: GanttBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-body absolute truncate rounded-sm"
      title={label}
      style={{
        left: leftPx,
        width: widthPx,
        height: rowHeight,
        top: 0,
        backgroundColor: color,
        color: textColor ?? "var(--surface-60)",
        borderRadius: 3,
        padding: "0 5px",
        lineHeight: `${rowHeight}px`,
      }}
    >
      {label}
    </button>
  );
}
