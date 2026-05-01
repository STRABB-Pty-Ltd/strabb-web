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

// Cleaning chips read their status, mirroring calendar-month-view + cleaning list.
const cleaningStatusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
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
  const windowSize = useAppStore((s) => s.calendar.windowSize);
  const anchor = useAppStore((s) => s.calendar.anchor);
  const customRange = useAppStore((s) => s.customRange);
  const submenu = useAppStore((s) => s.calendar.submenu);
  const { data: listingsData } = useListings();
  const allListings = (listingsData?.data ?? []) as unknown as Listing[];

  // Tickets are visible only when the operator explicitly clicks the Tickets
  // submenu chip - on Overview they crowd the gantt with operator workload
  // unrelated to booking context. Other calendar views (list, month) still
  // show tickets on overview because their layouts handle the noise better.
  const isOverview = submenu.length === 0 || submenu.includes("overview");
  const filteredEvents = isOverview ? events.filter((e) => e.type !== "ticket") : events;

  // Selecting the parent (e.g. Bannockburn Estate) means "show me everything
  // at this property" - implicitly include its children so the gantt has
  // rows to render Estate-level bookings against. Children stay opt-in: if a
  // user picks Lodge alone they get just Lodge.
  const explicitIds = new Set(selectedListings);
  const expandedIds = new Set(explicitIds);
  for (const l of allListings) {
    if (l.relationship === "parent" && explicitIds.has(l.id)) {
      for (const c of allListings) {
        if (c.parentId === l.id) expandedIds.add(c.id);
      }
    }
  }

  const visible =
    selectedListings.length > 0 ? allListings.filter((l) => expandedIds.has(l.id)) : allListings;

  // Order children + standalones in a stable display sequence. Each visible
  // parent's children are kept contiguous so a parent booking can render as
  // a single chip spanning all of them. Parents themselves do NOT get their
  // own row in this view (option B): instead, parent bookings are anchored
  // to their first child's row and span downward across the children. The
  // trailing pass catches any child whose parent is not visible.
  const visibleParents = visible.filter((l) => l.relationship === "parent");
  const ganttListings: Listing[] = [];
  const seen = new Set<string>();
  const place = (l: Listing) => {
    if (l.relationship === "parent") return;
    if (!seen.has(l.id)) {
      ganttListings.push(l);
      seen.add(l.id);
    }
  };
  for (const parent of visibleParents) {
    visible.filter((l) => l.parentId === parent.id).forEach(place);
  }
  visible.filter((l) => l.relationship === "standalone").forEach(place);
  visible.forEach(place);

  // Map parent listing id -> ordered list of child listings actually showing
  // in the gantt. Used to anchor parent-listing bookings to the first child
  // and to size the spanning chip.
  const childrenInGantt = new Map<string, Listing[]>();
  for (const parent of visibleParents) {
    childrenInGantt.set(
      parent.id,
      ganttListings.filter((l) => l.parentId === parent.id),
    );
  }

  // Look up a listing by id from the full set so we can resolve a booking's
  // listing relationship even when the parent itself isn't in the rows.
  const listingById = new Map(allListings.map((l) => [l.id, l]));

  const rows = ganttListings.map((l) => ({
    id: l.id,
    label: l.name,
  }));

  const range = ganttDateRange(windowSize, anchor, customRange);
  const dateRange = {
    start: new Date(range.startDate),
    end: new Date(range.endDate),
  };

  // Tickets render first in DOM order so booking bars on the same row paint
  // over them. Visually the ticket sits "behind" any overlapping booking.
  const orderedEvents = [...filteredEvents].sort((a, b) => {
    if (a.type === "ticket" && b.type !== "ticket") return -1;
    if (a.type !== "ticket" && b.type === "ticket") return 1;
    return 0;
  });

  return (
    <GanttView<CalendarEvent>
      rows={rows}
      items={orderedEvents}
      getRowId={(item) => {
        // Parent-listing bookings anchor to their first child's row so the
        // bar can visually span across all children.
        const listing = listingById.get(item.listingId);
        if (listing?.relationship === "parent") {
          const children = childrenInGantt.get(listing.id);
          if (children && children.length > 0) return children[0].id;
        }
        return item.listingId;
      }}
      getRowSpan={(item) => {
        const listing = listingById.get(item.listingId);
        if (listing?.relationship === "parent") {
          return childrenInGantt.get(listing.id)?.length ?? 1;
        }
        return 1;
      }}
      getDateRange={(item) => ({
        start: new Date(item.start),
        end: new Date(item.end),
      })}
      getColor={(item) => {
        if (item.type === "cleaning") {
          return cleaningStatusColors[item.status ?? ""] ?? "var(--status-success)";
        }
        return typeColors[item.type] ?? item.color;
      }}
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
