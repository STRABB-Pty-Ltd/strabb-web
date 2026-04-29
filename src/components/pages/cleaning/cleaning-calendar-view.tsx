"use client";

import { format, parseISO } from "date-fns";
import { BrushCleaning } from "lucide-react";

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
      getEventIcon={() => <BrushCleaning size={11} />}
      getEventLabel={(task) => format(new Date(task.scheduledTime), "h:mma")}
      onEventClick={(task) => openDrillDownPanel("cleaning", task.id)}
    />
  );
}
