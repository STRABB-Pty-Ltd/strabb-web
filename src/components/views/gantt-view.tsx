"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
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
   * Optional per-item insets, expressed as fractions of cellWidth.
   * - insetStart: where the bar starts within its first day (0 = full day,
   *   0.75 = right quarter for afternoon check-in, 0.25 = mid-morning for a
   *   turnover cleaning).
   * - insetEnd: where the bar ends within its last day (1 = full day,
   *   0.25 = left quarter for morning checkout, 0.75 = mid-afternoon for a
   *   turnover cleaning).
   * Back-to-back same-day turnovers leave the middle 50% as the cleaning gap;
   * a turnover cleaning event then fills that 25–75 % slot.
   */
  getPartialDay?: (item: T) => { insetStart?: number; insetEnd?: number };
  /** Optional 4px left-edge accent stripe. Used by the calendar gantt to flag
   *  a booking's channel without changing the bar's fill colour. */
  getAccentColor?: (item: T) => string | undefined;
  /** Optional icon rendered before the label. */
  getIcon?: (item: T) => ReactNode | undefined;
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
  getAccentColor,
  getIcon,
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
              {/* Day cells. No today-cell fill — it's the same neutral-30 as
                  the booking bars and made partial-day check-in slivers
                  indistinguishable from the cell behind them. Today is
                  signalled by the header highlight + the dashed line below. */}
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="shrink-0 border-r"
                  style={{
                    width: cellWidth,
                    height: ROW_HEIGHT,
                    borderColor: "var(--border)",
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
                // Insets only apply when the bar's edge is actually visible —
                // when the item extends past the viewport the bar continues
                // to the edge instead of being chopped.
                const insetStart = startClipped ? 0 : (partial?.insetStart ?? 0);
                const insetEnd = endClipped ? 1 : (partial?.insetEnd ?? 1);

                const leftPx = startClipped ? 0 : (visibleStart + insetStart) * cellWidth;
                const rightPx = endClipped
                  ? totalDays * cellWidth
                  : (visibleEnd + insetEnd) * cellWidth;
                // 5px adjacency gap only when the bar ends on a full-day right
                // edge (so neighbouring full-day bars don't touch). Partial-day
                // ends are already separated by their fractional inset, and
                // clipped bars sit flush with the viewport.
                const adjacencyGap = !endClipped && insetEnd === 1 ? 5 : 0;
                const widthPx = rightPx - leftPx - adjacencyGap;
                if (widthPx <= 0) return null;

                return (
                  <GanttBar
                    key={`${row.id}-${getLabel(item)}-${idx}`}
                    label={getLabel(item)}
                    color={getColor(item)}
                    textColor={getTextColor?.(item)}
                    accentColor={getAccentColor?.(item)}
                    icon={getIcon?.(item)}
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
