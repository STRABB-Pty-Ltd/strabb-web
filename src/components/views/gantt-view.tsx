"use client";

import { useRef, useState, useEffect } from "react";
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

const LABEL_WIDTH = 144;
const MIN_CELL_WIDTH = 34;

export function GanttView<T>({
  rows,
  items,
  getRowId,
  getDateRange,
  getColor,
  getLabel,
  dateRange,
  onItemClick,
  todayLineColor = "var(--status-danger)",
}: GanttViewProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellWidth, setCellWidth] = useState(34);

  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  const totalDays = days.length;
  const rangeStart = startOfDay(dateRange.start);
  const todayIndex = days.findIndex((d) => isToday(d));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - LABEL_WIDTH;
      const computed = Math.max(MIN_CELL_WIDTH, Math.floor(available / totalDays));
      setCellWidth(computed);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [totalDays]);

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto rounded-lg border"
      style={{ borderColor: "var(--border)" }}
    >
      <GanttHeader dateRange={dateRange} cellWidth={cellWidth} />

      {rows.map((row) => {
        const rowItems = items.filter((item) => getRowId(item) === row.id);

        return (
          <div key={row.id} className="flex" style={{ minHeight: 34 }}>
            {/* Row label */}
            <div
              className="flex shrink-0 items-center gap-base border-r border-b bg-white px-base text-body"
              style={{
                width: LABEL_WIDTH,
                position: "sticky",
                left: 0,
                zIndex: 5,
                borderColor: "var(--border)",
              }}
            >
              {row.color && (
                <span
                  className="h-base w-base shrink-0 rounded-full"
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
                    width: cellWidth,
                    height: 34,
                    borderColor: "var(--border)",
                    backgroundColor: isToday(day) ? "rgba(59, 130, 246, 0.03)" : undefined,
                  }}
                />
              ))}

              {/* Bars */}
              {rowItems.map((item, idx) => {
                const range = getDateRange(item);
                const startCol = Math.max(0, differenceInDays(startOfDay(range.start), rangeStart));
                const endCol = Math.min(
                  totalDays,
                  differenceInDays(startOfDay(range.end), rangeStart) + 1,
                );
                const spanCols = endCol - startCol;
                if (spanCols <= 0) return null;

                return (
                  <GanttBar
                    key={`${row.id}-${getLabel(item)}-${idx}`}
                    label={getLabel(item)}
                    color={getColor(item)}
                    startCol={startCol}
                    spanCols={spanCols}
                    cellWidth={cellWidth}
                    onClick={() => onItemClick(item)}
                  />
                );
              })}

              {/* Today line */}
              {todayIndex >= 0 && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0"
                  style={{
                    left: todayIndex * cellWidth + cellWidth / 2,
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
