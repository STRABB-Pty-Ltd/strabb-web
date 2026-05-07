"use client";

import { format, eachDayOfInterval, isToday } from "date-fns";

interface GanttHeaderProps {
  dateRange: { start: Date; end: Date };
  cellWidth: number;
}

export function GanttHeader({ dateRange, cellWidth }: GanttHeaderProps) {
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });

  return (
    <div className="flex" style={{ position: "sticky", top: 0, zIndex: 10 }}>
      {/* Day headers */}
      <div className="flex">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="px-xs py-xs text-body text-highlight-10 shrink-0 border-r border-b text-center"
            style={{
              width: cellWidth,
              backgroundColor: isToday(day) ? "var(--neutral-30)" : "var(--surface-60)",
              borderColor: "var(--border)",
            }}
          >
            <div>{format(day, "EEE")}</div>
            <div className="text-highlight-10 font-medium">{format(day, "d")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
