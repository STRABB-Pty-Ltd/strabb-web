"use client";

import { Monitor } from "lucide-react";

import { useCalendarEvents } from "@/hooks/use-calendar";
import { useMobileViewOverride } from "@/hooks/use-responsive-view";
import { useAppStore } from "@/stores/app-store";

import { CalendarGanttView } from "@/components/pages/calendar/calendar-gantt-view";
import { CalendarListView } from "@/components/pages/calendar/calendar-list-view";
import { CalendarMonthView } from "@/components/pages/calendar/calendar-month-view";

export default function CalendarPage() {
  const view = useAppStore((s) => s.calendar.view);
  const submenu = useAppStore((s) => s.calendar.submenu);
  const timeframe = useAppStore((s) => s.calendar.timeframe);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const { effectiveView, showMobileBanner } = useMobileViewOverride(view);

  const { data: events, isLoading } = useCalendarEvents(
    selectedListings,
    submenu,
    timeframe,
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
      {showMobileBanner && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <Monitor size={16} />
          Switch to desktop for Gantt/Calendar view
        </div>
      )}
      {effectiveView === "gantt" && <CalendarGanttView events={events} />}
      {effectiveView === "calendar" && <CalendarMonthView events={events} />}
      {effectiveView === "list" && <CalendarListView events={events} />}
    </div>
  );
}
