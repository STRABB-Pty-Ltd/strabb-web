"use client";

import { addDays } from "date-fns";

import { GanttView } from "@/components/views/gantt-view";
import type { CleaningTask } from "@/types/cleaning-task";
import { useListings } from "@/hooks/use-listings";
import { ganttDateRange } from "@/lib/timeframe-utils";
import { useAppStore } from "@/stores/app-store";
import type { Listing } from "@/types/listing";

const statusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  issues: "var(--status-issues)",
  cancelled: "var(--status-cancelled)",
};

const typeLabels: Record<string, string> = {
  checkout: "CO",
  checkin: "CI",
  deep_clean: "DC",
  mid_stay: "MS",
  inspection: "INS",
  turnover: "TO",
};

interface CleaningGanttViewProps {
  tasks: CleaningTask[];
}

export function CleaningGanttView({ tasks }: CleaningGanttViewProps) {
  const windowSize = useAppStore((s) => s.cleaning.windowSize);
  const anchor = useAppStore((s) => s.cleaning.anchor);
  const customRange = useAppStore((s) => s.customRange);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);
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
    <GanttView<CleaningTask>
      rows={rows}
      items={tasks}
      getRowId={(task) => task.listingId}
      getDateRange={(task) => {
        const start = new Date(task.scheduledTime);
        const end = addDays(start, Math.max(0.5, task.estimatedHours / 24));
        return { start, end };
      }}
      getColor={(task) => statusColors[task.status] ?? "var(--brand-10)"}
      getLabel={(task) =>
        `${typeLabels[task.type] ?? task.type} ${task.assigneeName ? `— ${task.assigneeName}` : ""}`
      }
      dateRange={dateRange}
      onItemClick={(task) => openDrillDownPanel("cleaning", task.id)}
    />
  );
}
