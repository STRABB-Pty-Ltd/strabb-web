"use client";

import { format } from "date-fns";
import { useMemo } from "react";

import { SortableList, type ColumnDef } from "@/components/views/sortable-list";
import { useAppStore } from "@/stores/app-store";
import type { Maintenance } from "@/types/maintenance";

const statusColors: Record<string, string> = {
  reported: "var(--status-pending)",
  scheduled: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  high: { bg: "var(--neutral-30)", text: "var(--status-danger)" },
  medium: { bg: "var(--neutral-30)", text: "var(--brand-10)" },
  low: { bg: "var(--neutral-30)", text: "var(--brand-10)" },
};

interface MaintenanceListViewProps {
  items: Maintenance[];
  propertyNames?: Record<string, string>;
}

export function MaintenanceListView({ items, propertyNames = {} }: MaintenanceListViewProps) {
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const columns: ColumnDef<Maintenance>[] = useMemo(
    () => [
      {
        key: "property",
        label: "Property",
        width: "180px",
        sortable: false,
        render: (m) => (
          <span className="text-body truncate text-gray-800">
            {propertyNames[m.propertyId] ?? m.propertyId.slice(0, 8)}
          </span>
        ),
      },
      {
        key: "description",
        label: "Description",
        sortable: false,
        render: (m) => <span className="text-body truncate text-gray-700">{m.description}</span>,
      },
      {
        key: "priority",
        label: "Priority",
        width: "100px",
        sortable: false,
        render: (m) => {
          const p = priorityColors[m.priority] ?? priorityColors.low;
          return (
            <span
              className="px-base py-xs text-body rounded-sm font-medium"
              style={{ backgroundColor: p.bg, color: p.text }}
            >
              {m.priority}
            </span>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        width: "120px",
        sortable: false,
        render: (m) => (
          <span
            className="px-base py-xs text-body rounded-full font-medium text-white"
            style={{ backgroundColor: statusColors[m.status] ?? "var(--brand-10)" }}
          >
            {m.status.replace("_", " ")}
          </span>
        ),
      },
      {
        key: "reported",
        label: "Reported",
        width: "140px",
        sortable: false,
        render: (m) => (
          <span className="font-data text-body">
            {format(new Date(m.dateReported), "d MMM yyyy")}
          </span>
        ),
      },
      {
        key: "scheduled",
        label: "Scheduled",
        width: "140px",
        sortable: false,
        render: (m) => (
          <span className="font-data text-body">
            {m.dateScheduled ? format(new Date(m.dateScheduled), "d MMM yyyy") : "—"}
          </span>
        ),
      },
      {
        key: "cost",
        label: "Cost",
        width: "100px",
        sortable: false,
        render: (m) => <span className="font-data text-body">{m.cost ? `$${m.cost}` : "—"}</span>,
      },
    ],
    [propertyNames],
  );

  return (
    <SortableList<Maintenance>
      columns={columns}
      data={items}
      sortKey="reported"
      sortDirection="desc"
      onSort={() => {
        /* server-side sort not supported yet */
      }}
      onRowClick={(m) => openDrillDownPanel("maintenance", m.id)}
      getRowId={(m) => m.id}
    />
  );
}
