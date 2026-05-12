"use client";

import { useMemo } from "react";

import { SortableList, type ColumnDef } from "@/components/views/sortable-list";
import { DEFAULT_TIMEZONE } from "@/hooks/use-property-timezone";
import { formatInPropertyTimezone } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/format-currency";
import type { TicketFilters } from "@/lib/api-hooks/tickets-api";
import { useAppStore } from "@/stores/app-store";
import type { Ticket } from "@/types/ticket";
import { TICKET_PRIORITY_OPTIONS, TICKET_STATUS_OPTIONS } from "@/types/ticket";

const statusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

const statusFgColors: Record<string, string> = {
  pending: "var(--status-pending-fg)",
  confirmed: "var(--status-confirmed-fg)",
  in_progress: "var(--status-in-progress-fg)",
  completed: "var(--status-completed-fg)",
  cancelled: "var(--status-cancelled-fg)",
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "var(--row-alt)", text: "var(--status-danger)" },
  high: { bg: "var(--row-alt)", text: "var(--status-danger)" },
  medium: { bg: "var(--row-alt)", text: "var(--highlight-10)" },
  low: { bg: "var(--row-alt)", text: "var(--highlight-10)" },
};

interface TicketsListViewProps {
  items: Ticket[];
  propertyNames?: Record<string, string>;
  propertyTimezones?: Record<string, string>;
  filters: TicketFilters;
  onFilterChange: <K extends keyof TicketFilters>(key: K, value: TicketFilters[K]) => void;
  propertyOptions: { value: string; label: string }[];
}

export function TicketsListView({
  items,
  propertyNames = {},
  propertyTimezones = {},
  filters,
  onFilterChange,
  propertyOptions,
}: TicketsListViewProps) {
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const columns: ColumnDef<Ticket>[] = useMemo(
    () => [
      {
        key: "property",
        label: "Property",
        width: "200px",
        sortable: false,
        filter: {
          value: filters.propertyId ?? "",
          options: [{ value: "", label: "All properties" }, ...propertyOptions],
          onChange: (v) => onFilterChange("propertyId", v || undefined),
        },
        render: (t) => (
          <span className="text-body text-highlight-10 truncate">
            {propertyNames[t.propertyId] ?? t.propertyId.slice(0, 8)}
          </span>
        ),
      },
      {
        key: "description",
        label: "Description",
        sortable: false,
        render: (t) => (
          <span className="text-body text-highlight-10 truncate">{t.description}</span>
        ),
      },
      {
        key: "priority",
        label: "Priority",
        width: "140px",
        sortable: false,
        filter: {
          value: filters.priority ?? "",
          options: [{ value: "", label: "All priorities" }, ...TICKET_PRIORITY_OPTIONS],
          onChange: (v) => onFilterChange("priority", v || undefined),
        },
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
        width: "140px",
        sortable: false,
        filter: {
          value: filters.status ?? "",
          options: [{ value: "", label: "All statuses" }, ...TICKET_STATUS_OPTIONS],
          onChange: (v) => onFilterChange("status", v || undefined),
        },
        render: (t) => (
          <span
            className="px-base py-xs text-body rounded-md font-medium"
            style={{
              backgroundColor: statusColors[t.status] ?? "var(--highlight-10)",
              color: statusFgColors[t.status] ?? "var(--surface-60)",
            }}
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
    [propertyNames, propertyTimezones, filters, onFilterChange, propertyOptions],
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
