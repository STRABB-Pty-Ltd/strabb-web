"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useCalendarEvents } from "@/hooks/use-calendar";
import { useIsMobile } from "@/hooks/use-responsive-view";
import { useAppStore } from "@/stores/app-store";

import { CalendarAgendaView } from "./_components/calendar-agenda-view";
import { CalendarGanttView } from "./_components/calendar-gantt-view";
import { CalendarListView } from "./_components/calendar-list-view";
import { CalendarMonthView } from "./_components/calendar-month-view";

export default function CalendarPage() {
  const view = useAppStore((s) => s.calendar.view);
  const submenu = useAppStore((s) => s.calendar.submenu);
  const windowSize = useAppStore((s) => s.calendar.windowSize);
  const anchor = useAppStore((s) => s.calendar.anchor);
  const selectedListings = useAppStore((s) => s.selectedListings);
  // Month view's grid can't shrink its 7 columns to a phone width the way
  // Gantt's cellWidth does, so below lg it swaps for an agenda list instead
  // (grouped-by-day cards, no horizontal squeeze). Gantt and List already
  // work unmodified at any width.
  const isMobile = useIsMobile();

  const { data: events, isLoading } = useCalendarEvents(
    selectedListings,
    submenu,
    windowSize,
    anchor,
  );

  if (isLoading) {
    return (
      <div className="space-y-xs" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading calendar</span>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} h={55} />
        ))}
      </div>
    );
  }

  // Gantt's own horizontal scroller and the month grid's flex-1/min-h-0
  // fit-to-screen sizing both depend on a fixed-height, overflow-hidden
  // ancestor - that's what this wrapper is for. Agenda and List are the odd
  // ones out: neither manages its own vertical scroll (List's SortableList
  // only has overflow-x-auto, for the horizontal column overflow), so they
  // need the OPPOSITE - no fixed height, no clip - letting Canvas's own
  // overflow-y-auto do the scrolling instead. With the fixed-height wrapper
  // in place, rows/days past the first screenful were being silently
  // clipped (agenda: stuck at ~3 day groups; list: next row's top sliver
  // visible and no further scroll), not just off-screen.
  const needsPageScroll = (view === "calendar" && isMobile) || view === "list";

  return (
    <div className={needsPageScroll ? "flex flex-col" : "flex h-full flex-col overflow-hidden"}>
      {view === "gantt" && <CalendarGanttView events={events ?? []} />}
      {view === "calendar" &&
        (isMobile ? (
          <CalendarAgendaView events={events ?? []} />
        ) : (
          <CalendarMonthView events={events ?? []} />
        ))}
      {view === "list" && <CalendarListView events={events ?? []} />}
    </div>
  );
}
