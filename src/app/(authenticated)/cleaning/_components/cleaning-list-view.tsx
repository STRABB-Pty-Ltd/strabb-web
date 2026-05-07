"use client";

import { useMemo } from "react";

import { SortableList, type ColumnDef } from "@/components/views/sortable-list";
import { DEFAULT_TIMEZONE } from "@/hooks/use-property-timezone";
import { formatInPropertyTimezone } from "@/lib/date-utils";
import type { CleaningTask } from "@/types/cleaning-task";
import { useAppStore } from "@/stores/app-store";

const statusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

const typeLabels: Record<string, string> = {
  turnover: "Turnover",
  deep_clean: "Deep Clean",
  ad_hoc: "Ad Hoc",
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "var(--row-alt)", text: "var(--status-danger)" },
  high: { bg: "var(--row-alt)", text: "var(--status-danger)" },
  medium: { bg: "var(--row-alt)", text: "var(--highlight-10)" },
  low: { bg: "var(--row-alt)", text: "var(--highlight-10)" },
};

interface CleaningListViewProps {
  tasks: CleaningTask[];
  listingTimezones: Record<string, string>;
}

export function CleaningListView({ tasks, listingTimezones }: CleaningListViewProps) {
  const listSort = useAppStore((s) => s.cleaning.listSort);
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const columns = useMemo<ColumnDef<CleaningTask>[]>(
    () => [
      {
        key: "listing",
        label: "Listing",
        width: "200px",
        render: (t) => (
          <div className="gap-base flex items-center">
            <span
              className="h-base w-base shrink-0 rounded-full"
              style={{ backgroundColor: t.listingColor }}
            />
            <span className="text-body truncate">{t.listingName}</span>
          </div>
        ),
      },
      {
        key: "type",
        label: "Type",
        width: "112px",
        render: (t) => (
          <span
            className="px-base py-xs text-body text-highlight-10 rounded-sm"
            style={{ backgroundColor: "var(--row-alt)" }}
          >
            {typeLabels[t.type] ?? t.type}
          </span>
        ),
      },
      {
        key: "scheduled",
        label: "Scheduled",
        width: "168px",
        render: (t) => {
          const tz = listingTimezones[t.listingId] ?? DEFAULT_TIMEZONE;
          return (
            <span className="font-data text-body">
              {formatInPropertyTimezone(t.scheduledTime, tz, "d MMM yyyy, HH:mm")}
            </span>
          );
        },
      },
      {
        key: "assignee",
        label: "Assignee",
        width: "160px",
        render: (t) => (
          <span className="text-body text-highlight-10">{t.cleanerName ?? "Unassigned"}</span>
        ),
      },
      {
        key: "status",
        label: "Status",
        width: "112px",
        render: (t) => (
          <span
            className="px-base py-xs text-body rounded-md font-medium"
            style={{
              backgroundColor: statusColors[t.status] ?? "var(--highlight-10)",
              color: "var(--surface-60)",
            }}
          >
            {t.status.replace("_", " ")}
          </span>
        ),
      },
      {
        key: "priority",
        label: "Priority",
        width: "112px",
        render: (t) => {
          const p = priorityColors[t.priority] ?? priorityColors.low;
          return (
            <span
              className="px-base py-xs text-body rounded-sm font-medium"
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
        width: "96px",
        render: (t) => (
          <span className="font-data text-body">
            {t.checklistDone}/{t.checklistTotal}
          </span>
        ),
      },
      {
        key: "hours",
        label: "Est. Hours",
        width: "89px",
        render: (t) => <span className="font-data text-body">{t.estimatedHours}h</span>,
      },
    ],
    [listingTimezones],
  );

  const [sortKey, sortDir] = listSort.includes("_")
    ? [
        listSort.substring(0, listSort.lastIndexOf("_")),
        listSort.substring(listSort.lastIndexOf("_") + 1) as "asc" | "desc",
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
          cmp = new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
          break;
        case "assignee":
          cmp = (a.cleanerName ?? "").localeCompare(b.cleanerName ?? "");
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
          cmp = new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [tasks, sortKey, sortDir]);

  const setCleaningListSort = useAppStore((s) => s.setCleaningListSort);

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setCleaningListSort(`${key}_${newDir}`);
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
