"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CalendarDayCell } from "./calendar-day-cell";

export interface CalendarGridProps<T> {
  mode: "month" | "week" | "day" | "fortnight";
  currentDate: Date;
  events: T[];
  getEventDate: (event: T) => { start: Date; end: Date };
  getEventColor: (event: T) => string;
  getEventLabel: (event: T) => string;
  onEventClick: (event: T) => void;
  onDateChange: (date: Date) => void;
  maxEventsPerCell?: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarGrid<T>({
  mode,
  currentDate,
  events,
  getEventDate,
  getEventColor,
  getEventLabel,
  onEventClick,
  onDateChange,
  maxEventsPerCell = 3,
}: CalendarGridProps<T>) {
  const navigatePrev = () => {
    switch (mode) {
      case "month":
        return onDateChange(subMonths(currentDate, 1));
      case "week":
        return onDateChange(subWeeks(currentDate, 1));
      case "fortnight":
        return onDateChange(subWeeks(currentDate, 2));
      case "day":
        return onDateChange(subDays(currentDate, 1));
    }
  };

  const navigateNext = () => {
    switch (mode) {
      case "month":
        return onDateChange(addMonths(currentDate, 1));
      case "week":
        return onDateChange(addWeeks(currentDate, 1));
      case "fortnight":
        return onDateChange(addWeeks(currentDate, 2));
      case "day":
        return onDateChange(addDays(currentDate, 1));
    }
  };

  const headerLabel = (() => {
    switch (mode) {
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "week":
      case "fortnight": {
        const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
        const we =
          mode === "week" ? endOfWeek(currentDate, { weekStartsOn: 1 }) : addDays(ws, 13);
        return `${format(ws, "d MMM")} – ${format(we, "d MMM yyyy")}`;
      }
      case "day":
        return format(currentDate, "EEEE, d MMMM yyyy");
    }
  })();

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
      return day >= new Date(range.start.toDateString()) && day <= new Date(range.end.toDateString());
    });

  if (mode === "day") {
    const dayEvents = getEventsForDay(currentDate);
    return (
      <div>
        <div className="mb-3 flex items-center gap-2">
          <button type="button" onClick={navigatePrev} className="rounded p-1 hover:bg-gray-100">
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-sm font-semibold">{headerLabel}</h3>
          <button type="button" onClick={navigateNext} className="rounded p-1 hover:bg-gray-100">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {dayEvents.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">No events</p>
          )}
          {dayEvents.map((ev, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onEventClick(ev)}
              className="flex items-center gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)" }}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: getEventColor(ev) }}
              />
              <span className="text-sm">{getEventLabel(ev)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header nav */}
      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={navigatePrev} className="rounded p-1 hover:bg-gray-100">
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-sm font-semibold">{headerLabel}</h3>
        <button type="button" onClick={navigateNext} className="rounded p-1 hover:bg-gray-100">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div
        className="grid border-l border-t"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          borderColor: "var(--border)",
        }}
      >
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="border-b border-r bg-gray-50 py-1 text-center text-xs font-medium text-gray-500"
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
