"use client";

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { CalendarDayCell } from "./calendar-day-cell";

export interface CalendarGridProps<T> {
  mode: "month" | "week" | "day" | "fortnight";
  currentDate: Date;
  events: T[];
  getEventDate: (event: T) => { start: Date; end: Date };
  getEventColor: (event: T) => string;
  getEventTextColor?: (event: T) => string;
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

  if (mode === "day") {
    const dayEvents = getEventsForDay(currentDate);
    return (
      <div>
        <div className="gap-base flex flex-col">
          {dayEvents.length === 0 && (
            <p className="py-lg text-body text-center text-gray-400">No events</p>
          )}
          {dayEvents.map((ev, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onEventClick(ev)}
              className="gap-base p-sm flex items-center rounded-lg border text-left transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)" }}
            >
              <span
                className="h-sm w-sm shrink-0 rounded-full"
                style={{ backgroundColor: getEventColor(ev) }}
              />
              <span className="text-body">{getEventLabel(ev)}</span>
            </button>
          ))}
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

        {gridDays.map((day) => {
          const dayEvents = getEventsForDay(day);
          const chipEvents = dayEvents.map((ev) => ({
            label: getEventLabel(ev),
            color: getEventColor(ev),
            textColor: getEventTextColor?.(ev),
            onClick: () => onEventClick(ev),
          }));

          return (
            <CalendarDayCell
              key={day.toISOString()}
              date={day}
              events={chipEvents}
              isCurrentMonth={mode !== "month" || isSameMonth(day, currentDate)}
              maxEvents={maxEventsPerCell}
              compact={mode === "fortnight"}
            />
          );
        })}
      </div>
    </div>
  );
}
