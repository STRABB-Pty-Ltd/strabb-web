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
  const windowSize = useAppStore((s) => s.calendar.windowSize);
  const anchor = useAppStore((s) => s.calendar.anchor);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const { effectiveView, showMobileBanner } = useMobileViewOverride(view);

  const { data: events, isLoading } = useCalendarEvents(
    selectedListings,
    submenu,
    windowSize,
    anchor,
  );

  if (isLoading) {
    return (
      <div className="py-xl flex items-center justify-center">
        <p className="text-body text-gray-400">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div>
      {showMobileBanner && (
        <div className="mb-sm gap-base px-sm py-base text-body flex items-center rounded-lg bg-blue-50 text-blue-700">
          <Monitor size={16} />
          Switch to desktop for Gantt/Calendar view
        </div>
      )}
      {effectiveView === "gantt" && <CalendarGanttView events={events ?? []} />}
      {effectiveView === "calendar" && <CalendarMonthView events={events ?? []} />}
      {effectiveView === "list" && <CalendarListView events={events ?? []} />}
    </div>
  );
}
