"use client";

interface CalendarEventChipProps {
  label: string;
  color: string;
  onClick: () => void;
}

export function CalendarEventChip({ label, color, onClick }: CalendarEventChipProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-full truncate rounded px-1.5 py-0.5 text-left text-xs text-white"
      style={{ backgroundColor: color }}
      title={label}
    >
      {label}
    </button>
  );
}
