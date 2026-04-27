"use client";

import { BrushCleaning } from "lucide-react";

import { GanttView } from "@/components/views/gantt-view";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { useListings } from "@/hooks/use-listings";
import { ganttDateRange } from "@/lib/timeframe-utils";
import { useAppStore } from "@/stores/app-store";
import type { Listing } from "@/types/listing";

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

// Channel accent stripe colours for booking bars. Same palette and meaning
// as the messaging page's left-border on each message card.
const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
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
      // Cleaning bars: replace the word "Turnover" with the broom icon below.
      // Strip the "Turnover" / "Turnover - " prefix so only the assignee
      // name (or nothing) remains as text alongside the icon.
      getLabel={(item) =>
        item.type === "cleaning" ? item.label.replace(/^Turnover\s*-?\s*/i, "") : item.label
      }
      getIcon={(item) => (item.type === "cleaning" ? <BrushCleaning size={13} /> : undefined)}
      // Bookings: 75–100 % of check-in day → middle days → 0–25 % of checkout
      // day, leaving the middle 50 % of any turnover day open.
      // Cleaning turnovers fill that gap (25–75 % of their day).
      // Vacancy / ticket events stay full-day.
      getPartialDay={(item) => {
        if (item.type === "booking") return { insetStart: 0.75, insetEnd: 0.25 };
        if (item.type === "cleaning") return { insetStart: 0.25, insetEnd: 0.75 };
        return {};
      }}
      getAccentColor={(item) =>
        item.type === "booking"
          ? (channelColors[item.channel ?? "direct"] ?? "var(--channel-direct)")
          : undefined
      }
      dateRange={dateRange}
      onItemClick={(item) => openDrillDownPanel(item.type, item.id)}
    />
  );
}
