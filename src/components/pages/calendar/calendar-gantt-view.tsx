"use client";

import { GanttView } from "@/components/views/gantt-view";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { useListings } from "@/hooks/use-listings";
import { ganttDateRange } from "@/lib/timeframe-utils";
import { useAppStore } from "@/stores/app-store";
import type { Listing } from "@/types/listing";

// Bookings get their channel-specific colour (already on item.color from
// the API mapper) so the rail reads the way the messaging page does:
// Airbnb red, Booking.com navy, Vrbo, direct, etc. Other event types keep
// their semantic colour.
const typeColors: Record<string, string> = {
  cleaning: "var(--status-success)",
  ticket: "var(--status-danger)",
  vacancy: "var(--neutral-30)",
};

const typeTextColors: Record<string, string> = {
  vacancy: "var(--brand-10)",
};

interface CalendarGanttViewProps {
  events: CalendarEvent[];
}

export function CalendarGanttView({ events }: CalendarGanttViewProps) {
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const submenu = useAppStore((s) => s.calendar.submenu);
  const windowSize = useAppStore((s) => s.calendar.windowSize);
  const anchor = useAppStore((s) => s.calendar.anchor);
  const customRange = useAppStore((s) => s.customRange);
  const isOverview = submenu.length === 0 || submenu.includes("overview");
  const { data: listingsData } = useListings();
  const allListings = (listingsData?.data ?? []) as unknown as Listing[];

  const listings =
    selectedListings.length > 0
      ? allListings.filter((l) => selectedListings.includes(l.id) && l.relationship !== "parent")
      : allListings.filter((l) => l.relationship !== "parent");

  const rows = listings.map((l) => ({
    id: l.id,
    label: l.name,
  }));

  const range = ganttDateRange(windowSize, anchor, customRange);
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
      getTextColor={(item) => typeTextColors[item.type] ?? "var(--surface-60)"}
      getLabel={(item) => item.label}
      // Bookings: 75–100 % of check-in day → middle days → 0–25 % of checkout
      // day, leaving the middle 50 % of any turnover day open.
      // Cleaning turnovers fill that gap (25–75 % of their day).
      // Vacancy / ticket events stay full-day.
      getPartialDay={(item) => {
        if (item.type === "booking") return { insetStart: 0.75, insetEnd: 0.25 };
        if (item.type === "cleaning") return { insetStart: 0.25, insetEnd: 0.75 };
        return {};
      }}
      dateRange={dateRange}
      onItemClick={(item) => openDrillDownPanel(item.type, item.id)}
    />
  );
}
