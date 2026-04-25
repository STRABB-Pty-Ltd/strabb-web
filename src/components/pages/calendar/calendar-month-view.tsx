"use client";

import { parseISO } from "date-fns";

import { CalendarGrid } from "@/components/views/calendar-grid";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { useAppStore } from "@/stores/app-store";

const windowSizeToMode: Record<string, "month" | "week" | "day" | "fortnight"> = {
  month: "month",
  week: "week",
  day: "day",
  fortnight: "fortnight",
};

const typeColors: Record<string, string> = {
  booking: "var(--neutral-30)",
  cleaning: "var(--status-success)",
  ticket: "var(--status-danger)",
  vacancy: "var(--neutral-30)",
};

const typeTextColors: Record<string, string> = {
  booking: "var(--brand-10)",
  vacancy: "var(--brand-10)",
};

interface CalendarMonthViewProps {
  events: CalendarEvent[];
}

export function CalendarMonthView({ events }: CalendarMonthViewProps) {
  const windowSize = useAppStore((s) => s.calendar.windowSize);
  const anchor = useAppStore((s) => s.calendar.anchor);
  const submenu = useAppStore((s) => s.calendar.submenu);
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);
  const isOverview = submenu.length === 0 || submenu.includes("overview");

  const mode = windowSizeToMode[windowSize] ?? "month";
  const currentDate = anchor ? parseISO(anchor) : new Date();

  return (
    <CalendarGrid<CalendarEvent>
      mode={mode}
      currentDate={currentDate}
      events={events}
      getEventDate={(ev) => ({
        start: new Date(ev.start),
        end: new Date(ev.end),
      })}
      getEventColor={(ev) => typeColors[ev.type] ?? ev.color}
      getEventTextColor={(ev) => typeTextColors[ev.type] ?? "var(--surface-60)"}
      getEventLabel={(ev) => ev.label}
      onEventClick={(ev) => openDrillDownPanel(ev.type, ev.id)}
    />
  );
}
