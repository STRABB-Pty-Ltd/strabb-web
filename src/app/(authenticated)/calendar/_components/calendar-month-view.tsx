"use client";

import { format, parseISO } from "date-fns";
import { BrushCleaning } from "lucide-react";

import { CalendarGrid } from "@/components/views/calendar-grid";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { useAppStore } from "@/stores/app-store";

const windowSizeToMode: Record<string, "month" | "week" | "day" | "fortnight"> = {
  month: "month",
  week: "week",
  day: "day",
  fortnight: "fortnight",
};

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

// Cleaning events on the calendar grid adopt the same status-driven palette
// as Cleaning/Calendar so a turnover's colour reads its progress at a glance.
const cleaningStatusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  ticket: "var(--status-issues)",
  cancelled: "var(--status-cancelled)",
};

// Channel accent stripe colours for booking chips. Same palette and meaning
// as the messaging page's left-border on each message card and the gantt
// view's booking accent.
const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

interface CalendarMonthViewProps {
  events: CalendarEvent[];
}

export function CalendarMonthView({ events }: CalendarMonthViewProps) {
  const windowSize = useAppStore((s) => s.calendar.windowSize);
  const anchor = useAppStore((s) => s.calendar.anchor);
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const mode = windowSizeToMode[windowSize] ?? "month";
  const currentDate = anchor ? parseISO(anchor) : new Date();

  return (
    <CalendarGrid<CalendarEvent>
      mode={mode}
      currentDate={currentDate}
      events={events}
      getEventDate={(ev) => ({
        start: new Date(ev.start),
        end: new Date(ev.end),
      })}
      getEventColor={(ev) => {
        if (ev.type === "cleaning") {
          return cleaningStatusColors[ev.status ?? ""] ?? "var(--status-success)";
        }
        return typeColors[ev.type] ?? ev.color;
      }}
      getEventTextColor={(ev) => typeTextColors[ev.type] ?? "var(--surface-60)"}
      getEventAccentColor={(ev) =>
        ev.type === "booking"
          ? (channelColors[ev.channel ?? "direct"] ?? "var(--channel-direct)")
          : undefined
      }
      getEventIcon={(ev) => (ev.type === "cleaning" ? <BrushCleaning size={11} /> : undefined)}
      getEventInset={(ev) => {
        // Match the calendar gantt's getPartialDay so a booking sits at
        // 75–100 % of its check-in cell and 0–25 % of its check-out cell,
        // with a turnover cleaning filling the 25–75 % gap on the same row.
        if (ev.type === "booking") return { insetStart: 0.75, insetEnd: 0.75 };
        if (ev.type === "cleaning") return { insetStart: 0.25, insetEnd: 0.25 };
        return { insetStart: 0, insetEnd: 0 };
      }}
      // Bookings are the spine of the calendar - they get the top tracks.
      // Cleanings and tickets sit beneath unless they share a track with a
      // booking (turnover handshake).
      isPrimaryEvent={(ev) => ev.type === "booking"}
      getEventLabel={(ev) => {
        if (ev.type === "cleaning") {
          return format(new Date(ev.start), "h:mma");
        }
        return ev.label;
      }}
      onEventClick={(ev) => openDrillDownPanel(ev.type, ev.id)}
    />
  );
}
