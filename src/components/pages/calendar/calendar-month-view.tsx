"use client";

import { CalendarGrid } from "@/components/views/calendar-grid";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { useAppStore } from "@/stores/app-store";

const timeframeToMode: Record<string, "month" | "week" | "day" | "fortnight"> = {
  month: "month",
  this_month: "month",
  week: "week",
  this_week: "week",
  day: "day",
  today: "day",
  fortnight: "fortnight",
  this_fortnight: "fortnight",
  last_month: "month",
  last_week: "week",
};

const typeColors: Record<string, string> = {
  booking: "#F59E0B",
  cleaning: "#10B981",
  maintenance: "#6366F1",
  vacancy: "#D1D5DB",
};

interface CalendarMonthViewProps {
  events: CalendarEvent[];
}

export function CalendarMonthView({ events }: CalendarMonthViewProps) {
  const timeframe = useAppStore((s) => s.calendar.timeframe);
  const submenu = useAppStore((s) => s.calendar.submenu);
  const calendarDate = useAppStore((s) => s.calendarDate);
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);
  const isOverview = submenu.length === 0 || submenu.includes("overview");

  const mode = timeframeToMode[timeframe] ?? "month";

  return (
    <CalendarGrid<CalendarEvent>
      mode={mode}
      currentDate={calendarDate}
      events={events}
      getEventDate={(ev) => ({
        start: new Date(ev.start),
        end: new Date(ev.end),
      })}
      getEventColor={(ev) => typeColors[ev.type] ?? ev.color}
      getEventLabel={(ev) => ev.label}
      onEventClick={(ev) => openDrillDownPanel(ev.type, ev.id)}
      onDateChange={() => {}}
    />
  );
}
