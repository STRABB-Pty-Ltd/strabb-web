"use client";

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

const timeframeToMode: Record<string, "month" | "week" | "day" | "fortnight"> = {
  this_month: "month",
  this_week: "week",
  today: "day",
  this_fortnight: "fortnight",
  last_month: "month",
  last_week: "week",
};

interface CleaningCalendarViewProps {
  tasks: CleaningTask[];
}

export function CleaningCalendarView({ tasks }: CleaningCalendarViewProps) {
  const timeframe = useAppStore((s) => s.cleaning.timeframe);
  const calendarDate = useAppStore((s) => s.calendarDate);
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const mode = timeframeToMode[timeframe] ?? "week";

  return (
    <CalendarGrid<CleaningTask>
      mode={mode}
      currentDate={calendarDate}
      events={tasks}
      getEventDate={(task) => {
        const d = new Date(task.scheduledTime);
        return { start: d, end: d };
      }}
      getEventColor={(task) => statusColors[task.status] ?? "#6B7280"}
      getEventLabel={(task) => `${task.listingName} — ${typeLabels[task.type] ?? task.type}`}
      onEventClick={(task) => openDrillDownPanel("cleaning", task.id)}
      onDateChange={() => {}}
    />
  );
}
