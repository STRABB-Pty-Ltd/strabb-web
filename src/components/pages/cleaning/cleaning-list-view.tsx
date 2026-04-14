"use client";

import { format } from "date-fns";
import { useMemo } from "react";

import {
  SortableList,
  type ColumnDef,
} from "@/components/views/sortable-list";
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

const priorityColors: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "#FEE2E2", text: "#DC2626" },
  high: { bg: "#FEF3C7", text: "#92400E" },
  medium: { bg: "#DBEAFE", text: "#1E40AF" },
  low: { bg: "#F3F4F6", text: "#6B7280" },
};

const columns: ColumnDef<CleaningTask>[] = [
  {
    key: "listing",
    label: "Listing",
    width: "180px",
    render: (t) => (
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: t.listingColor }}
        />
        <span className="truncate text-sm">{t.listingName}</span>
      </div>
    ),
  },
  {
    key: "type",
    label: "Type",
    width: "100px",
    render: (t) => (
      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
        {typeLabels[t.type] ?? t.type}
      </span>
    ),
  },
  {
    key: "scheduled",
    label: "Scheduled",
    width: "130px",
    render: (t) => (
      <span className="font-data text-xs">
        {format(new Date(t.scheduledTime), "d MMM yyyy, HH:mm")}
      </span>
    ),
  },
  {
    key: "assignee",
    label: "Assignee",
    width: "120px",
    render: (t) => (
      <span className="text-xs text-gray-600">
        {t.assigneeName ?? "Unassigned"}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    width: "110px",
    render: (t) => (
      <span
        className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
        style={{
          backgroundColor: statusColors[t.status] ?? "#6B7280",
        }}
      >
        {t.status === "issues" ? "ticket" : t.status.replace("_", " ")}
      </span>
    ),
  },
  {
    key: "priority",
    label: "Priority",
    width: "90px",
    render: (t) => {
      const p = priorityColors[t.priority] ?? priorityColors.low;
      return (
        <span
          className="rounded px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: p.bg, color: p.text }}
        >
          {t.priority}
        </span>
      );
    },
  },
  {
    key: "checklist",
    label: "Checklist",
    width: "80px",
    render: (t) => (
      <span className="font-data text-xs">
        {t.checklistDone}/{t.checklistTotal}
      </span>
    ),
  },
  {
    key: "hours",
    label: "Est. Hours",
    width: "80px",
    render: (t) => (
      <span className="font-data text-xs">{t.estimatedHours}h</span>
    ),
  },
];

interface CleaningListViewProps {
  tasks: CleaningTask[];
}

export function CleaningListView({ tasks }: CleaningListViewProps) {
  const listSort = useAppStore((s) => s.cleaning.listSort);
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const [sortKey, sortDir] = listSort.includes("_")
    ? [
        listSort.substring(0, listSort.lastIndexOf("_")),
        listSort.substring(listSort.lastIndexOf("_") + 1) as
          | "asc"
          | "desc",
      ]
    : [listSort, "asc" as const];

  const sorted = useMemo(() => {
    const arr = [...tasks];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "listing":
          cmp = a.listingName.localeCompare(b.listingName);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "scheduled":
        case "date":
          cmp =
            new Date(a.scheduledTime).getTime() -
            new Date(b.scheduledTime).getTime();
          break;
        case "assignee":
          cmp = (a.assigneeName ?? "").localeCompare(
            b.assigneeName ?? "",
          );
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "priority":
          cmp = a.priority.localeCompare(b.priority);
          break;
        case "hours":
          cmp = a.estimatedHours - b.estimatedHours;
          break;
        default:
          cmp =
            new Date(a.scheduledTime).getTime() -
            new Date(b.scheduledTime).getTime();
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [tasks, sortKey, sortDir]);

  const handleSort = (key: string) => {
    const store = useAppStore.getState();
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    store.setView("cleaning", store.cleaning.view);
    // Update listSort via direct state access since there's no dedicated action
    useAppStore.setState({
      cleaning: {
        ...store.cleaning,
        listSort: `${key}_${newDir}`,
      },
    });
  };

  return (
    <SortableList<CleaningTask>
      columns={columns}
      data={sorted}
      sortKey={sortKey}
      sortDirection={sortDir}
      onSort={handleSort}
      onRowClick={(task) => openDrillDownPanel("cleaning", task.id)}
      getRowId={(task) => task.id}
    />
  );
}
