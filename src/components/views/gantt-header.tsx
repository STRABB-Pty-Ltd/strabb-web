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
      <div className="shrink-0 bg-white" style={{ width: 160 }} />
      {/* Day headers */}
      <div className="flex">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="shrink-0 border-r border-b px-1 py-1 text-center text-xs text-gray-500"
            style={{
              width: cellWidth,
              backgroundColor: isToday(day) ? "rgba(59, 130, 246, 0.05)" : "white",
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
