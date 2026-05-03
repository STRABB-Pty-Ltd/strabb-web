"use client";

import { format } from "date-fns";

import { SortableList, type ColumnDef } from "@/components/views/sortable-list";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { useCalendarListSort } from "@/hooks/use-calendar";
import { useAppStore } from "@/stores/app-store";

const channelLabels: Record<string, string> = {
  airbnb: "Airbnb",
  booking_com: "Booking.com",
  vrbo: "VRBO",
  direct: "Direct",
};

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

const eventTypeChip: Record<string, { label: string; bg: string }> = {
  cleaning: { label: "Clean", bg: "var(--status-success)" },
  ticket: { label: "Ticket", bg: "var(--status-danger)" },
  vacancy: { label: "Vacancy", bg: "var(--brand-10)" },
};

const columns: ColumnDef<CalendarEvent>[] = [
  {
    key: "listing",
    label: "Listing",
    width: "144px",
    render: (ev) => <span className="text-body truncate text-gray-700">{ev.listingName}</span>,
  },
  {
    key: "guest",
    label: "Guest",
    width: "144px",
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
    width: "144px",
    render: (ev) => {
      if (ev.channel) {
        return (
          <span
            className="px-base py-xs text-body text-text-on-color rounded-sm font-medium"
            style={{
              backgroundColor: channelColors[ev.channel] ?? "var(--channel-direct)",
            }}
          >
            {channelLabels[ev.channel] ?? ev.channel}
          </span>
        );
      }
      const typeChip = eventTypeChip[ev.type];
      if (typeChip) {
        return (
          <span
            className="px-base py-xs text-body text-text-on-color rounded-sm font-medium"
            style={{ backgroundColor: typeChip.bg }}
          >
            {typeChip.label}
          </span>
        );
      }
      return <span className="text-gray-400">-</span>;
    },
  },
  {
    key: "checkin",
    label: "Check-in",
    width: "89px",
    render: (ev) => (
      <span className="font-data text-body">{format(new Date(ev.start), "d MMM yyyy")}</span>
    ),
  },
  {
    key: "checkout",
    label: "Check-out",
    width: "89px",
    render: (ev) => (
      <span className="font-data text-body">{format(new Date(ev.end), "d MMM yyyy")}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    width: "89px",
    render: (ev) => (
      <span className="text-body text-gray-600 capitalize">
        {(ev.status ?? ev.type).replace("_", " ")}
      </span>
    ),
  },
  {
    key: "amount",
    label: "Amount",
    width: "89px",
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
