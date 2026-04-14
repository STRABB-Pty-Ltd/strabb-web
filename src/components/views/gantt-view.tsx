"use client";

import { differenceInDays, eachDayOfInterval, isToday, startOfDay } from "date-fns";

import { GanttBar } from "./gantt-bar";
import { GanttHeader } from "./gantt-header";

export interface GanttViewProps<T> {
  rows: { id: string; label: string; color?: string }[];
  items: T[];
  getRowId: (item: T) => string;
  getDateRange: (item: T) => { start: Date; end: Date };
  getColor: (item: T) => string;
  getLabel: (item: T) => string;
  dateRange: { start: Date; end: Date };
  onItemClick: (item: T) => void;
  todayLineColor?: string;
}

export function GanttView<T>({
  rows,
  items,
  getRowId,
  getDateRange,
  getColor,
  getLabel,
  dateRange,
  onItemClick,
  todayLineColor = "#DC2626",
}: GanttViewProps<T>) {
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  const totalDays = days.length;
  const rangeStart = startOfDay(dateRange.start);

  const todayIndex = days.findIndex((d) => isToday(d));

  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <GanttHeader dateRange={dateRange} />

      {rows.map((row) => {
        const rowItems = items.filter((item) => getRowId(item) === row.id);

        return (
          <div key={row.id} className="flex" style={{ minHeight: 36 }}>
            {/* Row label */}
            <div
              className="flex shrink-0 items-center gap-2 border-b border-r bg-white px-2 text-sm"
              style={{
                width: 160,
                position: "sticky",
                left: 0,
                zIndex: 5,
                borderColor: "var(--border)",
              }}
            >
              {row.color && (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
              )}
              <span className="truncate">{row.label}</span>
            </div>

            {/* Grid area */}
            <div className="relative flex border-b" style={{ borderColor: "var(--border)" }}>
              {/* Day cells */}
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="shrink-0 border-r"
                  style={{
                    width: 40,
                    height: 36,
                    borderColor: "var(--border)",
                    backgroundColor: isToday(day) ? "rgba(59, 130, 246, 0.03)" : undefined,
                  }}
                />
              ))}

              {/* Bars */}
              {rowItems.map((item, idx) => {
                const range = getDateRange(item);
                const startCol = Math.max(
                  0,
                  differenceInDays(startOfDay(range.start), rangeStart),
                );
                const endCol = Math.min(
                  totalDays,
                  differenceInDays(startOfDay(range.end), rangeStart) + 1,
                );
                const spanCols = endCol - startCol;
                if (spanCols <= 0) return null;

                return (
                  <GanttBar
                    key={idx}
                    label={getLabel(item)}
                    color={getColor(item)}
                    startCol={startCol}
                    spanCols={spanCols}
                    onClick={() => onItemClick(item)}
                  />
                );
              })}

              {/* Today line */}
              {todayIndex >= 0 && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0"
                  style={{
                    left: todayIndex * 40 + 20,
                    width: 0,
                    borderLeft: `2px dashed ${todayLineColor}`,
                    zIndex: 8,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
