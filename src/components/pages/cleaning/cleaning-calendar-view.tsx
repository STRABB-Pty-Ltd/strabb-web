"use client";

import { parseISO } from "date-fns";

import { CalendarGrid } from "@/components/views/calendar-grid";
import type { CleaningTask } from "@/types/cleaning-task";
import { useAppStore } from "@/stores/app-store";

const statusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  issues: "var(--status-issues)",
  cancelled: "var(--status-cancelled)",
};

const typeLabels: Record<string, string> = {
  checkout: "Checkout",
  checkin: "Check-in",
  deep_clean: "Deep Clean",
  mid_stay: "Mid-Stay",
  inspection: "Inspection",
  turnover: "Turnover",
};

const windowSizeToMode: Record<string, "month" | "week" | "day" | "fortnight"> = {
  month: "month",
  week: "week",
  day: "day",
  fortnight: "fortnight",
};

interface CleaningCalendarViewProps {
  tasks: CleaningTask[];
}

export function CleaningCalendarView({ tasks }: CleaningCalendarViewProps) {
  const windowSize = useAppStore((s) => s.cleaning.windowSize);
  const anchor = useAppStore((s) => s.cleaning.anchor);
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const mode = windowSizeToMode[windowSize] ?? "week";
  const currentDate = anchor ? parseISO(anchor) : new Date();

  return (
    <CalendarGrid<CleaningTask>
      mode={mode}
      currentDate={currentDate}
      events={tasks}
      getEventDate={(task) => {
        const d = new Date(task.scheduledTime);
        return { start: d, end: d };
      }}
      getEventColor={(task) => statusColors[task.status] ?? "var(--brand-10)"}
      getEventLabel={(task) => `${task.listingName} — ${typeLabels[task.type] ?? task.type}`}
      onEventClick={(task) => openDrillDownPanel("cleaning", task.id)}
    />
  );
}
