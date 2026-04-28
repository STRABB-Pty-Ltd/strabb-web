"use client";

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { ReactNode } from "react";

import { CalendarDayCell } from "./calendar-day-cell";

export interface CalendarGridProps<T> {
  mode: "month" | "week" | "day" | "fortnight";
  currentDate: Date;
  events: T[];
  getEventDate: (event: T) => { start: Date; end: Date };
  getEventColor: (event: T) => string;
  getEventTextColor?: (event: T) => string;
  getEventAccentColor?: (event: T) => string | undefined;
  getEventIcon?: (event: T) => ReactNode | undefined;
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
  getEventLabel,
  onEventClick,
  maxEventsPerCell = 3,
}: CalendarGridProps<T>) {
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

  // Greedy track assignment: sort events by start, then place each one on the
  // lowest-numbered track whose previous event has already finished. Used per
  // week so a multi-day booking keeps the same vertical row in every cell it
  // spans (Tue track 1 → Wed track 1, not Wed track 0 because Tue's track-0
  // event ended).
  const assignTracks = (eventsInRange: T[]): Map<T, number> => {
    const sorted = eventsInRange.slice().sort((a, b) => {
      const ra = getEventDate(a);
      const rb = getEventDate(b);
      return ra.start.getTime() - rb.start.getTime() || ra.end.getTime() - rb.end.getTime();
    });
    const trackEnds: number[] = [];
    const result = new Map<T, number>();
    for (const ev of sorted) {
      const range = getEventDate(ev);
      const startMs = range.start.getTime();
      const endMs = range.end.getTime();
      let assigned = trackEnds.findIndex((endTime) => endTime < startMs);
      if (assigned === -1) {
        assigned = trackEnds.length;
        trackEnds.push(endMs);
      } else {
        trackEnds[assigned] = endMs;
      }
      result.set(ev, assigned);
    }
    return result;
  };

  // Group grid days into weeks (rows of 7) and pre-compute each week's track
  // assignments. Map week index → (event → track index). Also record how many
  // tracks each week needs so cells in a week share the same slot count and
  // every chip stays at the same vertical position across the days it spans.
  const weekTracks: Array<Map<T, number>> = [];
  const weekSlotCounts: number[] = [];
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

  return (
    <div>
      <div
        className="grid border-t border-l"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          borderColor: "var(--border)",
        }}
      >
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="py-xs text-body border-r border-b bg-gray-50 text-center font-medium text-gray-500"
            style={{ borderColor: "var(--border)" }}
          >
            {d}
          </div>
        ))}

        {gridDays.map((day, idx) => {
          const weekIdx = Math.floor(idx / 7);
          const trackMap = weekTracks[weekIdx];
          const slotCount = weekSlotCounts[weekIdx] ?? 0;
          const dayEvents = getEventsForDay(day);

          const tracks: Array<{
            label: string;
            color: string;
            textColor?: string;
            accentColor?: string;
            icon?: ReactNode;
            isEventStart?: boolean;
            isEventEnd?: boolean;
            onClick: () => void;
          } | null> = new Array(slotCount).fill(null);
          let overflowCount = 0;
          for (const ev of dayEvents) {
            const trackIdx = trackMap?.get(ev) ?? 0;
            const range = getEventDate(ev);
            const slot = {
              label: getEventLabel(ev),
              color: getEventColor(ev),
              textColor: getEventTextColor?.(ev),
              accentColor: getEventAccentColor?.(ev),
              icon: getEventIcon?.(ev),
              isEventStart: isSameDay(day, range.start),
              isEventEnd: isSameDay(day, range.end),
              onClick: () => onEventClick(ev),
            };
            if (trackIdx < slotCount) {
              tracks[trackIdx] = slot;
            } else {
              overflowCount += 1;
            }
          }

          return (
            <CalendarDayCell
              key={day.toISOString()}
              date={day}
              tracks={tracks}
              isCurrentMonth={mode !== "month" || isSameMonth(day, currentDate)}
              overflowCount={overflowCount}
              compact={mode === "fortnight"}
            />
          );
        })}
      </div>
    </div>
  );
}
