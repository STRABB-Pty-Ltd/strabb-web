"use client";

import { format } from "date-fns";

import { SortableList, type ColumnDef } from "@/components/views/sortable-list";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { useCalendarListSort } from "@/hooks/use-calendar";
import { formatChannel } from "@/lib/channels";
import { useAppStore } from "@/stores/app-store";

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

const formatAUD = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);

const eventTypeLabels: Record<string, string> = {
  cleaning: "Clean",
  ticket: "Ticket",
  vacancy: "Vacancy",
};

// Same status palette as the cleaning/ticket list views and gantt cleaning bars.
// Drives the colour of Clean and Ticket chips in the Source column.
const eventStatusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

const columns: ColumnDef<CalendarEvent>[] = [
  {
    key: "listing",
    label: "Listing",
    width: "200px",
    render: (ev) => <span className="text-body truncate text-gray-700">{ev.listingName}</span>,
  },
  {
    key: "guest",
    label: "Guest",
    width: "160px",
    render: (ev) =>
      ev.guest ? (
        <span className="text-body truncate text-gray-700">{ev.guest}</span>
      ) : (
        <span className="text-body text-gray-400">-</span>
      ),
  },
  {
    key: "channel",
    label: "Source",
    width: "128px",
    render: (ev) => {
      if (ev.channel) {
        // Mirror the calendar gantt booking-bar treatment: --row-alt main
        // fill, 0.5px brand-10 hairline top+bottom, and 4px channel-coloured
        // stripes on BOTH ends so the highlight wraps around the chip.
        const stripe = channelColors[ev.channel] ?? "var(--channel-direct)";
        return (
          <span
            className="px-base py-xs text-body rounded-md font-medium"
            style={{
              backgroundColor: "var(--row-alt)",
              color: "var(--brand-10)",
              borderTop: "0.5px solid var(--brand-10)",
              borderBottom: "0.5px solid var(--brand-10)",
              borderLeft: `4px solid ${stripe}`,
              borderRight: `4px solid ${stripe}`,
            }}
          >
            {formatChannel(ev.channel)}
          </span>
        );
      }
      const label = eventTypeLabels[ev.type];
      if (label) {
        return (
          <span
            className="px-base py-xs text-body rounded-sm font-medium"
            style={{
              backgroundColor: "var(--row-alt)",
              color: "var(--brand-10)",
            }}
          >
            {label}
          </span>
        );
      }
      return <span className="text-gray-400">-</span>;
    },
  },
  {
    key: "checkin",
    label: "Check-in",
    width: "112px",
    render: (ev) => (
      <span className="font-data text-body">{format(new Date(ev.start), "d MMM yyyy")}</span>
    ),
  },
  {
    key: "checkout",
    label: "Check-out",
    width: "112px",
    render: (ev) => (
      <span className="font-data text-body">{format(new Date(ev.end), "d MMM yyyy")}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    width: "112px",
    render: (ev) => {
      if (!ev.status) return <span className="text-body text-gray-400">-</span>;
      const bg = eventStatusColors[ev.status] ?? "var(--brand-10)";
      return (
        <span
          className="px-base py-xs text-body rounded-md font-medium capitalize"
          style={{ backgroundColor: bg, color: "var(--surface-60)" }}
        >
          {ev.status.replace("_", " ")}
        </span>
      );
    },
  },
  {
    key: "amount",
    label: "Amount",
    width: "96px",
    render: (ev) => (
      <span className="font-data text-body">{ev.amount ? formatAUD(ev.amount) : "-"}</span>
    ),
  },
];

interface CalendarListViewProps {
  events: CalendarEvent[];
}

export function CalendarListView({ events }: CalendarListViewProps) {
  const listSort = useAppStore((s) => s.calendar.listSort);
  const setCalendarListSort = useAppStore((s) => s.setCalendarListSort);
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const [sortKey, sortDir] = listSort.includes("_")
    ? [
        listSort.substring(0, listSort.lastIndexOf("_")),
        listSort.substring(listSort.lastIndexOf("_") + 1) as "asc" | "desc",
      ]
    : [listSort, "asc" as const];

  const sorted = useCalendarListSort(events, sortKey, sortDir);

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setCalendarListSort(`${key}_${newDir}`);
  };

  return (
    <SortableList<CalendarEvent>
      columns={columns}
      data={sorted}
      sortKey={sortKey}
      sortDirection={sortDir}
      onSort={handleSort}
      onRowClick={(ev) => openDrillDownPanel(ev.type, ev.id)}
      getRowId={(ev) => ev.id}
    />
  );
}
