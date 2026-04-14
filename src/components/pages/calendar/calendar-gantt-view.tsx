"use client";

import { addDays, startOfMonth, endOfMonth } from "date-fns";

import { GanttView } from "@/components/views/gantt-view";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { mockListingList } from "@/lib/mock-data";
import { useAppStore } from "@/stores/app-store";

interface CalendarGanttViewProps {
  events: CalendarEvent[];
}

export function CalendarGanttView({ events }: CalendarGanttViewProps) {
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);
  const selectedListings = useAppStore((s) => s.selectedListings);

  const listings =
    selectedListings.length > 0
      ? mockListingList.filter(
          (l) =>
            selectedListings.includes(l.id) && l.relationship !== "parent",
        )
      : mockListingList.filter((l) => l.relationship !== "parent");

  const rows = listings.map((l) => ({
    id: l.id,
    label: l.name,
    color: l.color,
  }));

  const now = new Date();
  const dateRange = {
    start: startOfMonth(now),
    end: addDays(endOfMonth(now), 7),
  };

  return (
    <GanttView<CalendarEvent>
      rows={rows}
      items={events}
      getRowId={(item) => item.listingId}
      getDateRange={(item) => ({
        start: new Date(item.start + "T00:00:00"),
        end: new Date(item.end + "T00:00:00"),
      })}
      getColor={(item) => item.color}
      getLabel={(item) => item.label}
      dateRange={dateRange}
      onItemClick={(item) => openDrillDownPanel(item.type, item.id)}
    />
  );
}
