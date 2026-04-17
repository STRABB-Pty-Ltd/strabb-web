"use client";

interface GanttBarProps {
  label: string;
  color: string;
  textColor?: string;
  startCol: number;
  spanCols: number;
  cellWidth: number;
  onClick: () => void;
}

export function GanttBar({
  label,
  color,
  textColor,
  startCol,
  spanCols,
  cellWidth,
  onClick,
}: GanttBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute truncate rounded-sm text-body"
      title={label}
      style={{
        left: startCol * cellWidth,
        width: spanCols * cellWidth - 5,
        height: 34,
        top: 0,
        backgroundColor: color,
        color: textColor ?? "var(--surface-60)",
        borderRadius: 3,
        padding: "0 5px",
        lineHeight: "34px",
      }}
    >
      {label}
    </button>
  );
}
