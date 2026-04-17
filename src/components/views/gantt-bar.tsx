"use client";

interface GanttBarProps {
  label: string;
  color: string;
  startCol: number;
  spanCols: number;
  cellWidth: number;
  onClick: () => void;
}

export function GanttBar({ label, color, startCol, spanCols, cellWidth, onClick }: GanttBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute truncate rounded-sm text-body text-white"
      title={label}
      style={{
        left: startCol * cellWidth,
        width: spanCols * cellWidth - 5,
        height: 34,
        top: 0,
        backgroundColor: color,
        borderRadius: 3,
        padding: "0 5px",
        lineHeight: "34px",
      }}
    >
      {label}
    </button>
  );
}
