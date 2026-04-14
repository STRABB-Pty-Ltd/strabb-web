"use client";

import { GanttView } from "@/components/views/gantt-view";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { useListings } from "@/hooks/use-listings";
import { timeframeToDateRange } from "@/lib/timeframe-utils";
import { useAppStore } from "@/stores/app-store";
import type { Listing } from "@/types/listing";

const typeColors: Record<string, string> = {
  booking: "#F59E0B",
  cleaning: "#10B981",
  maintenance: "#6366F1",
  vacancy: "#D1D5DB",
};

interface CalendarGanttViewProps {
  events: CalendarEvent[];
}

export function CalendarGanttView({ events }: CalendarGanttViewProps) {
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const submenu = useAppStore((s) => s.calendar.submenu);
  const timeframe = useAppStore((s) => s.calendar.timeframe);
  const isOverview = submenu.length === 0 || submenu.includes("overview");
  const { data: listingsData } = useListings();
  const allListings = (listingsData?.data ?? []) as unknown as Listing[];

  const listings =
    selectedListings.length > 0
      ? allListings.filter(
          (l) =>
            selectedListings.includes(l.id) && l.relationship !== "parent",
        )
      : allListings.filter((l) => l.relationship !== "parent");

  const rows = listings.map((l) => ({
    id: l.id,
    label: l.name,
  }));

  const range = timeframeToDateRange(timeframe);
  const dateRange = {
    start: new Date(range.startDate),
    end: new Date(range.endDate),
  };

  return (
    <GanttView<CalendarEvent>
      rows={rows}
      items={events}
      getRowId={(item) => item.listingId}
      getDateRange={(item) => ({
        start: new Date(item.start),
        end: new Date(item.end),
      })}
      getColor={(item) => typeColors[item.type] ?? item.color}
      getLabel={(item) => item.label}
      dateRange={dateRange}
      onItemClick={(item) => openDrillDownPanel(item.type, item.id)}
    />
  );
}
