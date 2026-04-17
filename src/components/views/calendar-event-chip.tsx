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
      className="w-full truncate rounded-sm px-xs py-xs text-left text-body text-white"
      style={{ backgroundColor: color }}
      title={label}
    >
      {label}
    </button>
  );
}
