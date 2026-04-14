"use client";

import { CalendarGrid } from "@/components/views/calendar-grid";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { useAppStore } from "@/stores/app-store";

const timeframeToMode: Record<
  string,
  "month" | "week" | "day" | "fortnight"
> = {
  this_month: "month",
  this_week: "week",
  today: "day",
  this_fortnight: "fortnight",
  last_month: "month",
  last_week: "week",
};

interface CalendarMonthViewProps {
  events: CalendarEvent[];
}

export function CalendarMonthView({ events }: CalendarMonthViewProps) {
  const timeframe = useAppStore((s) => s.calendar.timeframe);
  const calendarDate = useAppStore((s) => s.calendarDate);
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const mode = timeframeToMode[timeframe] ?? "month";

  return (
    <CalendarGrid<CalendarEvent>
      mode={mode}
      currentDate={calendarDate}
      events={events}
      getEventDate={(ev) => ({
        start: new Date(ev.start + "T00:00:00"),
        end: new Date(ev.end + "T00:00:00"),
      })}
      getEventColor={(ev) => ev.color}
      getEventLabel={(ev) => ev.label}
      onEventClick={(ev) => openDrillDownPanel(ev.type, ev.id)}
      onDateChange={() => {}}
    />
  );
}
