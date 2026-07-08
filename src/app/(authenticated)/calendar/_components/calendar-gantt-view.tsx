"use client";

import { BrushCleaning, CalendarOff } from "lucide-react";

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
  availability_block: "var(--status-warning-tint)",
};

// Cleaning chips read their status, mirroring calendar-month-view + cleaning list.
const cleaningStatusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

const cleaningStatusFgColors: Record<string, string> = {
  pending: "var(--status-danger-fg)",
  confirmed: "var(--status-confirmed-fg)",
  in_progress: "var(--status-success-fg)",
  completed: "var(--status-success-fg)",
  cancelled: "var(--status-cancelled-fg)",
};

const typeTextColors: Record<string, string> = {
  booking: "var(--highlight-10)",
  vacancy: "var(--highlight-10)",
  availability_block: "var(--status-warning)",
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

// Locally-augmented event used for synthetic "implicit block" shadows
// generated from parent/child relationships - never shipped from the API.
type GanttEvent = CalendarEvent & { isImplicitBlock?: boolean };

export function CalendarGanttView({ events }: CalendarGanttViewProps) {
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);
  const openAvailabilityBlockDrawer = useAppStore((s) => s.openAvailabilityBlockDrawer);
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

  // Order rows in a stable display sequence: each visible parent gets its
  // own row, with its children placed contiguously beneath it; standalone
  // listings come after. Parent bookings render in the parent's own row;
  // bidirectional blocking (parent booked → children unavailable, and vice
  // versa) is enforced by conflict-detection on the API side. The trailing
  // pass catches any child whose parent isn't visible in the current
  // selection.
  const visibleParents = visible.filter((l) => l.relationship === "parent");
  const ganttListings: Listing[] = [];
  const seen = new Set<string>();
  const place = (l: Listing) => {
    if (!seen.has(l.id)) {
      ganttListings.push(l);
      seen.add(l.id);
    }
  };
  for (const parent of visibleParents) {
    place(parent);
    visible.filter((l) => l.parentId === parent.id).forEach(place);
  }
  visible.filter((l) => l.relationship === "standalone").forEach(place);
  visible.forEach(place);

  const rows = ganttListings.map((l) => ({
    id: l.id,
    label: l.name,
  }));

  // Build implicit-block shadow events to visualise bidirectional blocking:
  // a parent booking blocks each child's row, and a child booking blocks the
  // parent's row, even though only one side carries the actual booking.
  // Shadows only render on rows that are visible in the gantt; if a parent
  // isn't selected, no shadow is generated for it (and vice versa).
  // Cancelled / checked_out bookings don't occupy a slot and so don't
  // block - skip them. Mirrors the API's INACTIVE_STATUSES rule.
  const INACTIVE_BOOKING_STATUSES = new Set(["cancelled", "checked_out"]);
  const visibleListingIds = new Set(ganttListings.map((l) => l.id));
  const childrenByParent = new Map<string, string[]>();
  for (const l of allListings) {
    if (l.parentId) {
      const list = childrenByParent.get(l.parentId) ?? [];
      list.push(l.id);
      childrenByParent.set(l.parentId, list);
    }
  }

  // First pass: collect raw shadow ranges per target row.
  type ShadowRange = { start: number; end: number; sourceId: string };
  const rangesByRow = new Map<string, ShadowRange[]>();
  const pushRange = (rowId: string, event: CalendarEvent) => {
    const list = rangesByRow.get(rowId) ?? [];
    list.push({
      start: new Date(event.start).getTime(),
      end: new Date(event.end).getTime(),
      sourceId: event.id,
    });
    rangesByRow.set(rowId, list);
  };

  for (const event of filteredEvents) {
    if (event.type !== "booking") continue;
    if (event.status && INACTIVE_BOOKING_STATUSES.has(event.status)) continue;
    const listing = allListings.find((l) => l.id === event.listingId);
    if (!listing) continue;

    if (listing.relationship === "parent") {
      const childIds = childrenByParent.get(listing.id) ?? [];
      for (const childId of childIds) {
        if (!visibleListingIds.has(childId)) continue;
        pushRange(childId, event);
      }
    } else if (listing.parentId && visibleListingIds.has(listing.parentId)) {
      pushRange(listing.parentId, event);
    }
  }

  // Second pass: merge overlapping/adjacent ranges per row into one chip.
  // Without merging, two children booked across a turnover paint two
  // 60%-opacity shadows that compound to ~84% in the overlap region,
  // visible as a darker band. One merged chip per occupied window keeps
  // the shading uniform.
  const shadowEvents: GanttEvent[] = [];
  for (const [rowId, ranges] of rangesByRow) {
    if (ranges.length === 0) continue;
    ranges.sort((a, b) => a.start - b.start);
    let curStart = ranges[0].start;
    let curEnd = ranges[0].end;
    let curSourceId = ranges[0].sourceId;
    const flush = () => {
      shadowEvents.push({
        id: `shadow-${rowId}-${curSourceId}-${curStart}`,
        type: "booking",
        listingId: rowId,
        listingName: "",
        label: "",
        start: new Date(curStart).toISOString(),
        end: new Date(curEnd).toISOString(),
        color: "var(--neutral-30)",
        isImplicitBlock: true,
      });
    };
    for (let i = 1; i < ranges.length; i++) {
      const r = ranges[i];
      if (r.start <= curEnd) {
        if (r.end > curEnd) curEnd = r.end;
      } else {
        flush();
        curStart = r.start;
        curEnd = r.end;
        curSourceId = r.sourceId;
      }
    }
    flush();
  }

  const range = ganttDateRange(windowSize, anchor, customRange);
  const dateRange = {
    start: new Date(range.startDate),
    end: new Date(range.endDate),
  };

  // Render order: shadows first (so they paint behind real events), then
  // tickets (so booking/cleaning bars paint over them), then everything else.
  const orderedEvents: GanttEvent[] = [...filteredEvents, ...shadowEvents].sort((a, b) => {
    if (a.isImplicitBlock && !b.isImplicitBlock) return -1;
    if (!a.isImplicitBlock && b.isImplicitBlock) return 1;
    if (a.type === "ticket" && b.type !== "ticket") return -1;
    if (a.type !== "ticket" && b.type === "ticket") return 1;
    return 0;
  });

  return (
    <GanttView<GanttEvent>
      rows={rows}
      items={orderedEvents}
      getRowId={(item) => item.listingId}
      getRowSpan={() => 1}
      getIsBlocked={(item) => item.isImplicitBlock === true}
      getDateRange={(item) => ({
        start: new Date(item.start),
        end: new Date(item.end),
      })}
      getColor={(item) => {
        if (item.isImplicitBlock) return "var(--neutral-30)";
        if (item.type === "cleaning") {
          return cleaningStatusColors[item.status ?? ""] ?? "var(--status-success)";
        }
        return typeColors[item.type] ?? item.color;
      }}
      getTextColor={(item) => {
        if (typeTextColors[item.type]) return typeTextColors[item.type];
        if (item.type === "cleaning") {
          return cleaningStatusFgColors[item.status ?? ""] ?? "var(--status-success-fg)";
        }
        if (item.type === "ticket") return "var(--status-danger-fg)";
        return "var(--surface-60)";
      }}
      // Cleaning bars: replace the word "Turnover" with the broom icon below.
      // Strip the "Turnover" / "Turnover - " prefix so only the assignee
      // name (or nothing) remains as text alongside the icon.
      getLabel={(item) => {
        if (item.isImplicitBlock) return "";
        return item.type === "cleaning" ? item.label.replace(/^Turnover\s*-?\s*/i, "") : item.label;
      }}
      getIcon={(item) => {
        if (item.isImplicitBlock) return undefined;
        if (item.type === "availability_block")
          return <CalendarOff size={13} aria-hidden="true" />;
        return item.type === "cleaning" ? (
          <BrushCleaning size={13} aria-hidden="true" />
        ) : undefined;
      }}
      // Bookings: 75–100 % of check-in day → middle days → 0–25 % of checkout
      // day, leaving the middle 50 % of any turnover day open.
      // Cleaning turnovers fill that gap (25–75 % of their day).
      // Vacancy spans use the same handshake: start after a checkout
      // (25 %) and end before a checkin (75 %) so the bar doesn't claim
      // the partial-booking day.
      // Ticket events stay full-day. Shadows mirror their source booking's
      // pattern (same 75/25 inset) so the implicit-block shading tracks
      // exactly when the related row is actually unavailable.
      getPartialDay={(item) => {
        if (item.type === "booking" || item.type === "availability_block" || item.isImplicitBlock)
          return { insetStart: 0.75, insetEnd: 0.25 };
        if (item.type === "cleaning") return { insetStart: 0.25, insetEnd: 0.75 };
        if (item.type === "vacancy") return { insetStart: 0.25, insetEnd: 0.75 };
        return {};
      }}
      getAccentColor={(item) => {
        if (item.isImplicitBlock) return undefined;
        return item.type === "booking"
          ? (channelColors[item.channel ?? "direct"] ?? "var(--channel-direct)")
          : undefined;
      }}
      dateRange={dateRange}
      onItemClick={(item) => {
        if (item.isImplicitBlock) return;
        if (item.type === "availability_block") {
          openAvailabilityBlockDrawer(item.id);
          return;
        }
        openDrillDownPanel(item.type, item.id);
      }}
    />
  );
}
