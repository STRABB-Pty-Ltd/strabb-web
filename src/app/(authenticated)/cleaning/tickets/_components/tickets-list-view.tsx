"use client";

import { useMemo } from "react";

import { SortableList, type ColumnDef } from "@/components/views/sortable-list";
import { DEFAULT_TIMEZONE } from "@/hooks/use-property-timezone";
import { formatInPropertyTimezone } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/format-currency";
import { useAppStore } from "@/stores/app-store";
import type { Ticket } from "@/types/ticket";

const statusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "var(--row-alt)", text: "var(--status-danger)" },
  high: { bg: "var(--row-alt)", text: "var(--status-danger)" },
  medium: { bg: "var(--row-alt)", text: "var(--brand-10)" },
  low: { bg: "var(--row-alt)", text: "var(--brand-10)" },
};

interface TicketsListViewProps {
  items: Ticket[];
  propertyNames?: Record<string, string>;
  propertyTimezones?: Record<string, string>;
}

export function TicketsListView({
  items,
  propertyNames = {},
  propertyTimezones = {},
}: TicketsListViewProps) {
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const columns: ColumnDef<Ticket>[] = useMemo(
    () => [
      {
        key: "property",
        label: "Property",
        width: "180px",
        sortable: false,
        render: (t) => (
          <span className="text-body truncate text-gray-800">
            {propertyNames[t.propertyId] ?? t.propertyId.slice(0, 8)}
          </span>
        ),
      },
      {
        key: "description",
        label: "Description",
        sortable: false,
        render: (t) => <span className="text-body truncate text-gray-700">{t.description}</span>,
      },
      {
        key: "priority",
        label: "Priority",
        width: "100px",
        sortable: false,
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
        key: "status",
        label: "Status",
        width: "120px",
        sortable: false,
        render: (t) => (
          <span
            className={`px-base py-xs text-body rounded-md font-medium ${
              t.status === "confirmed" ? "text-white" : "text-text-on-color"
            }`}
            style={{ backgroundColor: statusColors[t.status] ?? "var(--brand-10)" }}
          >
            {t.status.replace("_", " ")}
          </span>
        ),
      },
      {
        key: "reported",
        label: "Reported",
        width: "140px",
        sortable: false,
        render: (t) => {
          const tz = propertyTimezones[t.propertyId] ?? DEFAULT_TIMEZONE;
          return (
            <span className="font-data text-body">
              {formatInPropertyTimezone(t.dateReported, tz, "d MMM yyyy")}
            </span>
          );
        },
      },
      {
        key: "scheduled",
        label: "Scheduled",
        width: "140px",
        sortable: false,
        render: (t) => {
          const tz = propertyTimezones[t.propertyId] ?? DEFAULT_TIMEZONE;
          return (
            <span className="font-data text-body">
              {t.dateScheduled ? formatInPropertyTimezone(t.dateScheduled, tz, "d MMM yyyy") : "-"}
            </span>
          );
        },
      },
      {
        key: "cost",
        label: "Cost",
        width: "100px",
        sortable: false,
        render: (t) => (
          <span className="font-data text-body">
            {t.cost != null ? formatCurrency(t.cost, t.currency) : "-"}
          </span>
        ),
      },
    ],
    [propertyNames, propertyTimezones],
  );

  return (
    <SortableList<Ticket>
      columns={columns}
      data={items}
      sortKey="reported"
      sortDirection="desc"
      onSort={() => {
        /* server-side sort not supported yet */
      }}
      onRowClick={(t) => openDrillDownPanel("ticket", t.id)}
      getRowId={(t) => t.id}
    />
  );
}
