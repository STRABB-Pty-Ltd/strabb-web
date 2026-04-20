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
      {/* Spacer for label column */}
      <div className="shrink-0 bg-white" style={{ width: 144 }} />
      {/* Day headers */}
      <div className="flex">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="px-xs py-xs text-body shrink-0 border-r border-b text-center text-gray-500"
            style={{
              width: cellWidth,
              backgroundColor: isToday(day) ? "var(--neutral-30)" : "var(--surface-60)",
              borderColor: "var(--border)",
            }}
          >
            <div>{format(day, "EEE")}</div>
            <div className="font-medium text-gray-700">{format(day, "d")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
