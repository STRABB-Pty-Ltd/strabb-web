"use client";

interface GanttBarProps {
  label: string;
  color: string;
  startCol: number;
  spanCols: number;
  onClick: () => void;
}

export function GanttBar({ label, color, startCol, spanCols, onClick }: GanttBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute truncate rounded text-xs text-white"
      title={label}
      style={{
        left: startCol * 40,
        width: spanCols * 40 - 4,
        height: 28,
        top: 2,
        backgroundColor: color,
        borderRadius: 4,
        padding: "0 6px",
        lineHeight: "28px",
      }}
    >
      {label}
    </button>
  );
}
