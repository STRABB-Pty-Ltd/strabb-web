"use client";

import { Monitor } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useCalendarEvents } from "@/hooks/use-calendar";
import { useMobileViewOverride } from "@/hooks/use-responsive-view";
import { useAppStore } from "@/stores/app-store";

import { CalendarGanttView } from "./_components/calendar-gantt-view";
import { CalendarListView } from "./_components/calendar-list-view";
import { CalendarMonthView } from "./_components/calendar-month-view";

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
      <div className="space-y-xs" aria-busy="true">
        <span className="sr-only">Loading calendar</span>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} h={55} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {showMobileBanner && (
        <div className="mb-sm gap-base px-sm py-base text-body bg-neutral-30 text-highlight-10 flex items-center rounded-lg">
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
