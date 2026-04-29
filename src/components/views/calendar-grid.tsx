"use client";

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { ReactNode } from "react";

import { CalendarDayCell } from "./calendar-day-cell";

const DAY_MS = 86_400_000;

export interface CalendarGridProps<T> {
  mode: "month" | "week" | "day" | "fortnight";
  currentDate: Date;
  events: T[];
  getEventDate: (event: T) => { start: Date; end: Date };
  getEventColor: (event: T) => string;
  getEventTextColor?: (event: T) => string;
  getEventAccentColor?: (event: T) => string | undefined;
  getEventIcon?: (event: T) => ReactNode | undefined;
  /** Per-event fractional cell insets used by the calendar grid to mirror
   *  the gantt's getPartialDay: bookings sit at 75–100% of the check-in cell
   *  and 0–25% of the check-out cell, cleanings fill 25–75% of their day.
   *  Both the chip placement and the track-assignment overlap test use these
   *  insets, so a turnover day's outgoing booking, cleaning, and incoming
   *  booking can share one track. */
  getEventInset?: (event: T) => { insetStart: number; insetEnd: number };
  /** Returns true for events that should occupy the top track rows. Tracks
   *  containing any primary event keep their lower indices; tracks holding
   *  only secondary events (e.g. lonely cleanings or tickets) get pushed
   *  beneath the booking rows so cells read as "bookings on top, ancillary
   *  events below" instead of cleanings hogging row 0. */
  isPrimaryEvent?: (event: T) => boolean;
  getEventLabel: (event: T) => string;
  onEventClick: (event: T) => void;
  maxEventsPerCell?: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarGrid<T>({
  mode,
  currentDate,
  events,
  getEventDate,
  getEventColor,
  getEventTextColor,
  getEventAccentColor,
  getEventIcon,
  getEventInset,
  isPrimaryEvent,
  getEventLabel,
  onEventClick,
  maxEventsPerCell = 3,
}: CalendarGridProps<T>) {
  const insetFor = (ev: T) => getEventInset?.(ev) ?? { insetStart: 0, insetEnd: 0 };
  const isPrimary = (ev: T) => isPrimaryEvent?.(ev) ?? true;
  const getDays = (): Date[] => {
    switch (mode) {
      case "month": {
        const ms = startOfMonth(currentDate);
        const me = endOfMonth(currentDate);
        const gridStart = startOfWeek(ms, { weekStartsOn: 1 });
        const gridEnd = endOfWeek(me, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: gridStart, end: gridEnd });
      }
      case "week": {
        const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: ws, end: addDays(ws, 6) });
      }
      case "fortnight": {
        const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: ws, end: addDays(ws, 13) });
      }
      case "day":
        return [currentDate];
    }
  };

  const gridDays = getDays();
  const gridCols = mode === "day" ? 1 : 7;

  const getEventsForDay = (day: Date) =>
    events.filter((ev) => {
      const range = getEventDate(ev);
      return (
        day >= new Date(range.start.toDateString()) && day <= new Date(range.end.toDateString())
      );
    });

  // Greedy track assignment using inset-adjusted ranges so a turnover day's
  // outgoing booking (ending at 25% of the day), cleaning (25–75%), and
  // incoming booking (starting at 75%) end up on the same track instead of
  // three stacked rows. Sort by effective start and place each event on the
  // lowest-numbered track whose previous event has already finished.
  const assignTracks = (eventsInRange: T[]): Map<T, number> => {
    const effective = eventsInRange.map((ev) => {
      const range = getEventDate(ev);
      const inset = insetFor(ev);
      return {
        ev,
        startMs: startOfDay(range.start).getTime() + inset.insetStart * DAY_MS,
        endMs: startOfDay(range.end).getTime() + (1 - inset.insetEnd) * DAY_MS,
      };
    });
    effective.sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
    const trackEnds: number[] = [];
    const greedy = new Map<T, number>();
    for (const { ev, startMs, endMs } of effective) {
      // <= so a chip that ends exactly when the next one begins (e.g. 06:00
      // turnover boundary) is allowed to share the same track.
      let assigned = trackEnds.findIndex((endTime) => endTime <= startMs);
      if (assigned === -1) {
        assigned = trackEnds.length;
        trackEnds.push(endMs);
      } else {
        trackEnds[assigned] = endMs;
      }
      greedy.set(ev, assigned);
    }

    // Second pass: pull tracks that contain any primary event (bookings) to
    // the front, leaving tracks with only secondary events (lonely cleanings,
    // tickets) on the back so they don't hog row 0 when they're not part of
    // a turnover handshake with a booking on the same track.
    const trackHasPrimary = new Map<number, boolean>();
    for (const [ev, trackIdx] of greedy) {
      if (isPrimary(ev)) trackHasPrimary.set(trackIdx, true);
      else if (!trackHasPrimary.has(trackIdx)) trackHasPrimary.set(trackIdx, false);
    }
    const primaryTracks: number[] = [];
    const secondaryTracks: number[] = [];
    for (const [trackIdx, hasPrimary] of [...trackHasPrimary].sort((a, b) => a[0] - b[0])) {
      (hasPrimary ? primaryTracks : secondaryTracks).push(trackIdx);
    }
    const remap = new Map<number, number>();
    primaryTracks.forEach((oldIdx, newIdx) => remap.set(oldIdx, newIdx));
    secondaryTracks.forEach((oldIdx, newIdx) => remap.set(oldIdx, primaryTracks.length + newIdx));
    const result = new Map<T, number>();
    for (const [ev, oldIdx] of greedy) {
      result.set(ev, remap.get(oldIdx) ?? oldIdx);
    }
    return result;
  };

  // Group grid days into weeks (rows of 7) and pre-compute each week's track
  // assignments. Map week index → (event → track index). Also record how many
  // tracks each week needs so cells in a week share the same slot count and
  // every chip stays at the same vertical position across the days it spans.
  // weekLabelDay records which day-in-week each event should carry its label
  // on; weekNextOnTrack lets a labeled chip cap its label width to the next
  // chip on the same track so the ellipsis lands at a sensible boundary.
  const weekTracks: Array<Map<T, number>> = [];
  const weekSlotCounts: number[] = [];
  const weekLabelDay: Array<Map<T, number>> = [];
  const weekNextOnTrack: Array<Map<T, T | undefined>> = [];
  if (mode !== "day") {
    for (let i = 0; i < gridDays.length; i += 7) {
      const weekDays = gridDays.slice(i, i + 7);
      const weekStart = new Date(weekDays[0].toDateString());
      const weekEnd = new Date(weekDays[weekDays.length - 1].toDateString());
      const eventsInWeek = events.filter((ev) => {
        const range = getEventDate(ev);
        const evStart = new Date(range.start.toDateString());
        const evEnd = new Date(range.end.toDateString());
        return evStart <= weekEnd && evEnd >= weekStart;
      });
      const trackMap = assignTracks(eventsInWeek);
      weekTracks.push(trackMap);
      let maxTrack = -1;
      for (const trackIdx of trackMap.values()) {
        if (trackIdx > maxTrack) maxTrack = trackIdx;
      }
      weekSlotCounts.push(Math.min(maxTrack + 1, maxEventsPerCell));

      const labelDay = new Map<T, number>();
      for (const ev of eventsInWeek) {
        const range = getEventDate(ev);
        const inset = insetFor(ev);
        const evStartMs = startOfDay(range.start).getTime();
        const evEndMs = startOfDay(range.end).getTime();
        let firstDay = -1;
        let widest = -1;
        for (let d = 0; d < weekDays.length; d++) {
          const dMs = startOfDay(weekDays[d]).getTime();
          if (dMs < evStartMs || dMs > evEndMs) continue;
          if (firstDay === -1) firstDay = d;
          const isStart = dMs === evStartMs;
          const isEnd = dMs === evEndMs;
          const width = 1 - (isStart ? inset.insetStart : 0) - (isEnd ? inset.insetEnd : 0);
          if (width > widest) widest = width;
        }
        // Anchor the label to the FIRST day the event touches in this week
        // (the bar's leftmost visible edge). The label then overflows right
        // across the rest of the bar via the chip's overflow:visible. Skip
        // the label entirely when the event's only day in this week is a
        // 25 % partial — a lonely check-in/check-out doesn't get words.
        if (firstDay >= 0 && widest > 0.25) labelDay.set(ev, firstDay);
      }
      weekLabelDay.push(labelDay);

      // Build per-track ordered event lists so we can find the next chip on
      // the same track for each event — used to cap a labeled chip's text
      // overflow at the next chip's left edge.
      const trackToEvents = new Map<number, T[]>();
      for (const [ev, trackIdx] of trackMap.entries()) {
        if (!trackToEvents.has(trackIdx)) trackToEvents.set(trackIdx, []);
        trackToEvents.get(trackIdx)!.push(ev);
      }
      for (const list of trackToEvents.values()) {
        list.sort((a, b) => {
          const sa = startOfDay(getEventDate(a).start).getTime() + insetFor(a).insetStart * DAY_MS;
          const sb = startOfDay(getEventDate(b).start).getTime() + insetFor(b).insetStart * DAY_MS;
          return sa - sb;
        });
      }
      const nextOnTrack = new Map<T, T | undefined>();
      for (const list of trackToEvents.values()) {
        for (let j = 0; j < list.length; j++) {
          nextOnTrack.set(list[j], list[j + 1]);
        }
      }
      weekNextOnTrack.push(nextOnTrack);
    }
  }

  if (mode === "day") {
    const dayEvents = getEventsForDay(currentDate);
    return (
      <div>
        <div className="gap-base flex flex-col">
          {dayEvents.length === 0 && (
            <p className="py-lg text-body text-center text-gray-400">No events</p>
          )}
          {dayEvents.map((ev, i) => {
            const accent = getEventAccentColor?.(ev);
            const icon = getEventIcon?.(ev);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onEventClick(ev)}
                className="gap-base p-sm flex items-center rounded-lg border text-left transition-colors hover:bg-gray-50"
                style={{
                  borderColor: "var(--border)",
                  borderLeft: accent ? `4px solid ${accent}` : undefined,
                }}
              >
                <span
                  className="h-sm w-sm shrink-0 rounded-full"
                  style={{ backgroundColor: getEventColor(ev) }}
                />
                {icon && <span className="shrink-0 leading-none">{icon}</span>}
                <span className="text-body">{getEventLabel(ev)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const rowCount = Math.ceil(gridDays.length / 7);
  const rowMinPx = mode === "fortnight" ? 55 : 89;

  return (
    <div className="flex h-full flex-col">
      <div
        className="grid flex-1"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          // Header row sized to its content; data rows share the remaining
          // height equally (with a sensible per-row minimum) so the
          // calendar fits the canvas without scrolling on typical
          // viewports while still being usable when the canvas is short.
          gridTemplateRows: `auto repeat(${rowCount}, minmax(${rowMinPx}px, 1fr))`,
        }}
      >
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className="py-xs text-body bg-gray-50 text-center font-medium text-gray-500"
            style={{
              borderRight: i === DAY_LABELS.length - 1 ? undefined : "2px solid var(--neutral-30)",
              borderBottom: "2px solid var(--neutral-30)",
            }}
          >
            {d}
          </div>
        ))}

        {gridDays.map((day, idx) => {
          const weekIdx = Math.floor(idx / 7);
          const trackMap = weekTracks[weekIdx];
          const slotCount = weekSlotCounts[weekIdx] ?? 0;
          const labelDay = weekLabelDay[weekIdx];
          const nextOnTrack = weekNextOnTrack[weekIdx];
          const dayEvents = getEventsForDay(day);
          const dayIdxInWeek = idx % 7;
          const weekDays = gridDays.slice(weekIdx * 7, weekIdx * 7 + 7);
          const weekStartMs = startOfDay(weekDays[0]).getTime();

          type Slot = {
            label: string;
            color: string;
            textColor?: string;
            accentColor?: string;
            icon?: ReactNode;
            isEventStart?: boolean;
            isEventEnd?: boolean;
            insetStart?: number;
            insetEnd?: number;
            showLabel?: boolean;
            labelMaxWidth?: string;
            clampLeftEdge?: boolean;
            onClick: () => void;
          };
          const tracks: Slot[][] = Array.from({ length: slotCount }, () => []);
          let overflowCount = 0;
          for (const ev of dayEvents) {
            const trackIdx = trackMap?.get(ev) ?? 0;
            const range = getEventDate(ev);
            const inset = insetFor(ev);
            const isStart = isSameDay(day, range.start);
            const isEnd = isSameDay(day, range.end);
            const showLabel = labelDay?.get(ev) === dayIdxInWeek;

            // Cap a labeled chip's text overflow to the smaller of:
            //   1. cells remaining of the bar in this week
            //   2. cells until the next chip on the same track
            // Expressed as a percent of the chip's own width so it's
            // applied directly as max-width on the label span.
            let labelMaxWidth: string | undefined;
            if (showLabel) {
              const chipWidth = 1 - (isStart ? inset.insetStart : 0) - (isEnd ? inset.insetEnd : 0);
              const labelStartCells = dayIdxInWeek + (isStart ? inset.insetStart : 0);

              // Bar end inside this week (capped at week's last day + 1).
              const evStartMs = startOfDay(range.start).getTime();
              const evEndMs = startOfDay(range.end).getTime();
              const lastDayMs = startOfDay(weekDays[6]).getTime();
              let lastInWeekIdx = 6;
              let lastIsEnd = false;
              if (evEndMs <= lastDayMs) {
                lastInWeekIdx = Math.round((evEndMs - weekStartMs) / DAY_MS);
                lastIsEnd = true;
              }
              const barEndCells = lastInWeekIdx + 1 - (lastIsEnd ? inset.insetEnd : 0);
              let availableCells = barEndCells - labelStartCells;

              const next = nextOnTrack?.get(ev);
              if (next) {
                const nextRange = getEventDate(next);
                const nextInset = insetFor(next);
                const nextStartMs = startOfDay(nextRange.start).getTime();
                const nextDayIdx = Math.max(0, Math.round((nextStartMs - weekStartMs) / DAY_MS));
                const nextStartCells = nextDayIdx + nextInset.insetStart;
                availableCells = Math.min(
                  availableCells,
                  Math.max(0, nextStartCells - labelStartCells),
                );
              }

              if (chipWidth > 0 && availableCells > 0) {
                const ratio = availableCells / chipWidth;
                labelMaxWidth = `calc(${ratio * 100}% - var(--space-xs))`;
              }
              // suppress evStartMs / evEndMs unused-var lint when narrowed
              void evStartMs;
            }

            const slot: Slot = {
              label: getEventLabel(ev),
              color: getEventColor(ev),
              textColor: getEventTextColor?.(ev),
              accentColor: getEventAccentColor?.(ev),
              icon: getEventIcon?.(ev),
              isEventStart: isStart,
              isEventEnd: isEnd,
              insetStart: inset.insetStart,
              insetEnd: inset.insetEnd,
              showLabel,
              labelMaxWidth,
              clampLeftEdge: dayIdxInWeek === 0,
              onClick: () => onEventClick(ev),
            };
            if (trackIdx < slotCount) {
              tracks[trackIdx].push(slot);
            } else {
              overflowCount += 1;
            }
          }

          const lastRowIdx = Math.floor((gridDays.length - 1) / 7);
          return (
            <CalendarDayCell
              key={day.toISOString()}
              date={day}
              tracks={tracks}
              isCurrentMonth={mode !== "month" || isSameMonth(day, currentDate)}
              overflowCount={overflowCount}
              isLastColumn={dayIdxInWeek === 6}
              isLastRow={weekIdx === lastRowIdx}
            />
          );
        })}
      </div>
    </div>
  );
}
