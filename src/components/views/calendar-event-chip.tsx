"use client";

interface CalendarEventChipProps {
  label: string;
  color: string;
  textColor?: string;
  onClick: () => void;
}

export function CalendarEventChip({ label, color, textColor, onClick }: CalendarEventChipProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="px-xs py-xs text-body w-full truncate rounded-sm text-left"
      style={{ backgroundColor: color, color: textColor ?? "var(--surface-60)" }}
      title={label}
    >
      {label}
    </button>
  );
}
