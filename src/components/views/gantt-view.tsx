"use client";

import { useRef, useState, useEffect, useLayoutEffect, type ReactNode } from "react";
import { differenceInDays, eachDayOfInterval, isToday, startOfDay } from "date-fns";

import { useIsMobile } from "@/hooks/use-responsive-view";

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
  /** Optional: how many adjacent rows this item visually spans. When > 1 the
   *  bar grows tall enough to cover the additional rows below its anchor row,
   *  used by the calendar gantt to render a parent-listing booking as a
   *  single chip across all its children's rows. Default 1. */
  getRowSpan?: (item: T) => number;
  /** Optional: when true, the bar is rendered as a non-interactive "implicit
   *  block" (muted fill, diagonal stripes, no label). Used to flag rows that
   *  are blocked by a related booking elsewhere in the hierarchy. */
  getIsBlocked?: (item: T) => boolean;
  dateRange: { start: Date; end: Date };
  onItemClick: (item: T) => void;
  todayLineColor?: string;
  /** Called (whenever its closure goes stale, i.e. cellWidth/todayIndex
   *  change) with an imperative "scroll to today" function. Lets a parent
   *  page render its own "Today" button without GanttView needing to expose
   *  a ref (this component is generic over T, which doesn't mix cleanly
   *  with forwardRef). */
  onRegisterScrollToToday?: (fn: () => void) => void;
}

// = --space-lg (34px). Numeric form because it flows into pixel-math for
// cellWidth, ResizeObserver values, and absolute positioning offsets.
const MIN_CELL_WIDTH = 34;
// Listing-row height. Doubled from 34 -> 68 so the gantt rail reads at a
// more comfortable density. Header height is unaffected.
// = 2 * --space-lg.
const ROW_HEIGHT = 68;
// Vertical gap between rows; matches the mb-xs (var(--space-xs)) class on
// each row container. Multi-row spanning bars need this so their height
// covers the gap as well as the row strips.
// = --space-xs (5px).
const ROW_GAP = 5;

// Pinch-zoom bounds - deliberately wider than MIN_CELL_WIDTH in both
// directions: zooming out below the auto-fit width shows more of the date
// range at once, zooming in above it makes bars/labels easier to read.
const ZOOM_MIN_CELL_WIDTH = 18;
const ZOOM_MAX_CELL_WIDTH = 140;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function touchDistance(touches: React.TouchList) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function touchMidpointX(touches: React.TouchList) {
  return (touches[0].clientX + touches[1].clientX) / 2;
}

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
  getRowSpan,
  getIsBlocked,
  dateRange,
  onItemClick,
  todayLineColor = "var(--status-danger)",
  onRegisterScrollToToday,
}: GanttViewProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Pinch-zoom and the Today button are mobile-only (below lg, the same
  // cutover the desktop-first shell uses everywhere else) - desktop already
  // has a working fit-to-width gantt and its own stepper in SubmenuBar.
  const isMobile = useIsMobile(1024);
  const [autoCellWidth, setAutoCellWidth] = useState(34);
  // Set once the user pinch-zooms; overrides the auto-fit width until the
  // component unmounts (persists across date paging on purpose - see the
  // pinch handler comment below).
  const [manualCellWidth, setManualCellWidth] = useState<number | null>(null);
  const cellWidth = manualCellWidth ?? autoCellWidth;

  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  const totalDays = days.length;
  const rangeStart = startOfDay(dateRange.start);
  const todayIndex = days.findIndex((d) => isToday(d));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const computed = Math.max(MIN_CELL_WIDTH, Math.floor(entry.contentRect.width / totalDays));
      setAutoCellWidth(computed);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [totalDays]);

  useEffect(() => {
    onRegisterScrollToToday?.(() => {
      const el = containerRef.current;
      if (!el || todayIndex < 0) return;
      const target = todayIndex * cellWidth + cellWidth / 2 - el.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    });
  }, [onRegisterScrollToToday, todayIndex, cellWidth]);

  // Pinch-to-zoom (mobile): two fingers scale cellWidth between the ZOOM_*
  // bounds. Anchored on the pinch midpoint via pendingScrollAnchorRef +
  // the layout effect below, so the date under the fingers stays under the
  // fingers instead of the view drifting sideways as cells resize.
  const pinchRef = useRef<{ startDistance: number; startCellWidth: number } | null>(null);
  const pendingScrollAnchorRef = useRef<{ dayAtMidpoint: number; midpointX: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    if (e.touches.length === 2) {
      pinchRef.current = { startDistance: touchDistance(e.touches), startCellWidth: cellWidth };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    const distance = touchDistance(e.touches);
    const ratio = distance / pinchRef.current.startDistance;
    const nextCellWidth = clamp(
      pinchRef.current.startCellWidth * ratio,
      ZOOM_MIN_CELL_WIDTH,
      ZOOM_MAX_CELL_WIDTH,
    );

    const midpointX = touchMidpointX(e.touches) - el.getBoundingClientRect().left;
    pendingScrollAnchorRef.current = {
      dayAtMidpoint: (el.scrollLeft + midpointX) / cellWidth,
      midpointX,
    };
    setManualCellWidth(nextCellWidth);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
  };

  // Runs synchronously after cellWidth commits (before paint) so the
  // re-anchored scroll position lands in the same frame as the resize -
  // a regular effect would paint one frame at the old scroll position first.
  useLayoutEffect(() => {
    const pending = pendingScrollAnchorRef.current;
    const el = containerRef.current;
    if (!pending || !el) return;
    pendingScrollAnchorRef.current = null;
    el.scrollLeft = Math.max(0, pending.dayAtMidpoint * cellWidth - pending.midpointX);
  }, [cellWidth]);

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto rounded-lg border"
      style={{ borderColor: "var(--border)", touchAction: isMobile ? "pan-x" : undefined }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <GanttHeader dateRange={dateRange} cellWidth={cellWidth} />

      {rows.map((row) => {
        const rowItems = items.filter((item) => getRowId(item) === row.id);

        return (
          <div key={row.id} className="mb-xs flex" style={{ minHeight: ROW_HEIGHT }}>
            {/* Grid area */}
            <div className="relative flex border-b" style={{ borderColor: "var(--border)" }}>
              {/* Day cells. No today-cell fill - it's the same neutral-30 as
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
                // Insets only apply when the bar's edge is actually visible -
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
                // 5 = --space-xs.
                const adjacencyGap = !endClipped && insetEnd === 1 ? 5 : 0;
                const widthPx = rightPx - leftPx - adjacencyGap;
                if (widthPx <= 0) return null;

                // Row span: a parent-listing booking renders as a single
                // chip covering its anchor row plus the rows below for each
                // additional spanned row. Height includes the inter-row gaps
                // so the chip reads as one continuous bar.
                const span = Math.max(1, getRowSpan?.(item) ?? 1);
                const heightPx = span * ROW_HEIGHT + (span - 1) * ROW_GAP;

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
                    rowHeight={heightPx}
                    spans={span}
                    isBlocked={getIsBlocked?.(item) ?? false}
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
