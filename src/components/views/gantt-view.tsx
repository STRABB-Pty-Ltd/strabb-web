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
  getTextColor?: (item: T) => string;
  getLabel: (item: T) => string;
  /**
   * Optional per-item flags. When set, the bar is inset on its first/last day
   * cell — start day shows only the right 25% (afternoon check-in), end day
   * shows only the left 25% (morning checkout). Back-to-back same-day
   * turnovers naturally leave the middle 50% as the cleaning gap.
   */
  getPartialDay?: (item: T) => { atStart?: boolean; atEnd?: boolean };
  dateRange: { start: Date; end: Date };
  onItemClick: (item: T) => void;
  todayLineColor?: string;
}

const LABEL_WIDTH = 144;
const MIN_CELL_WIDTH = 34;
// Listing-row height. Doubled from 34 → 68 so the gantt rail reads at a
// more comfortable density. Header height is unaffected.
const ROW_HEIGHT = 68;

export function GanttView<T>({
  rows,
  items,
  getRowId,
  getDateRange,
  getColor,
  getTextColor,
  getLabel,
  getPartialDay,
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
          <div key={row.id} className="mb-xs flex" style={{ minHeight: ROW_HEIGHT }}>
            {/* Row label */}
            <div
              className="gap-base px-base text-body flex shrink-0 items-center border-r border-b bg-white"
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
                    height: ROW_HEIGHT,
                    borderColor: "var(--border)",
                    backgroundColor: isToday(day) ? "var(--neutral-30)" : undefined,
                  }}
                />
              ))}

              {/* Bars */}
              {rowItems.map((item, idx) => {
                const range = getDateRange(item);
                const rawStart = differenceInDays(startOfDay(range.start), rangeStart);
                const rawEnd = differenceInDays(startOfDay(range.end), rangeStart);

                const startClipped = rawStart < 0;
                const endClipped = rawEnd >= totalDays;
                const visibleStart = Math.max(0, rawStart);
                const visibleEnd = Math.min(totalDays - 1, rawEnd);
                if (visibleEnd < 0 || visibleStart > visibleEnd) return null;

                const partial = getPartialDay?.(item);
                // Insets only apply to the visible end of the bar — when the
                // booking extends past the viewport the bar continues to the
                // edge instead of being chopped at 25%/75%.
                const insetStart = !startClipped && partial?.atStart ? 0.75 : 0;
                const insetEnd = !endClipped && partial?.atEnd ? 0.25 : 1;

                const leftPx = startClipped ? 0 : (visibleStart + insetStart) * cellWidth;
                const rightPx = endClipped
                  ? totalDays * cellWidth
                  : (visibleEnd + insetEnd) * cellWidth;
                const widthPx = rightPx - leftPx - 5;
                if (widthPx <= 0) return null;

                return (
                  <GanttBar
                    key={`${row.id}-${getLabel(item)}-${idx}`}
                    label={getLabel(item)}
                    color={getColor(item)}
                    textColor={getTextColor?.(item)}
                    leftPx={leftPx}
                    widthPx={widthPx}
                    rowHeight={ROW_HEIGHT}
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
