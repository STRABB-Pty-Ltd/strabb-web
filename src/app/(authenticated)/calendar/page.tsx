"use client";

import { useCalendarEvents } from "@/hooks/use-calendar";
import { useAppStore } from "@/stores/app-store";

import { CalendarGanttView } from "@/components/pages/calendar/calendar-gantt-view";
import { CalendarListView } from "@/components/pages/calendar/calendar-list-view";
import { CalendarMonthView } from "@/components/pages/calendar/calendar-month-view";

export default function CalendarPage() {
  const view = useAppStore((s) => s.calendar.view);
  const submenu = useAppStore((s) => s.calendar.submenu);
  const selectedListings = useAppStore((s) => s.selectedListings);

  const { data: events, isLoading } = useCalendarEvents(
    selectedListings,
    submenu,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {view === "gantt" && <CalendarGanttView events={events} />}
      {view === "calendar" && <CalendarMonthView events={events} />}
      {view === "list" && <CalendarListView events={events} />}
    </div>
  );
}
