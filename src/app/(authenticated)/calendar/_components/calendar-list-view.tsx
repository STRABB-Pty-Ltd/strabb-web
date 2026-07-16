"use client";

import { format } from "date-fns";
import { LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SortableList, type ColumnDef } from "@/components/views/sortable-list";
import { TimeframeStepper } from "@/components/views/timeframe-stepper";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { useCalendarListSort } from "@/hooks/use-calendar";
import { formatChannel } from "@/lib/channels";
import { useAppStore } from "@/stores/app-store";

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
  ota: "var(--channel-ota)",
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
  availability_block: "Blocked",
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

const eventStatusFgColors: Record<string, string> = {
  pending: "var(--status-danger-fg)",
  confirmed: "var(--status-confirmed-fg)",
  in_progress: "var(--status-success-fg)",
  completed: "var(--status-success-fg)",
  cancelled: "var(--status-cancelled-fg)",
};

const columns: ColumnDef<CalendarEvent>[] = [
  {
    key: "listing",
    label: "Listing",
    width: "200px",
    render: (ev) => <span className="text-body text-highlight-10 truncate">{ev.listingName}</span>,
  },
  {
    key: "guest",
    label: "Guest",
    width: "160px",
    render: (ev) =>
      ev.guest ? (
        <span className="text-body text-highlight-10 truncate">{ev.guest}</span>
      ) : (
        <span className="text-body text-highlight-10">-</span>
      ),
  },
  {
    key: "channel",
    label: "Source",
    width: "128px",
    render: (ev) => {
      if (ev.channel) {
        // Mirror the calendar gantt booking-bar treatment: --row-alt main
        // fill, 0.5px highlight-10 hairline top+bottom, and 4px channel-coloured
        // stripes on BOTH ends so the highlight wraps around the chip.
        const stripe = channelColors[ev.channel] ?? "var(--channel-direct)";
        return (
          <span
            className="px-base py-xs text-body rounded-md font-medium"
            style={{
              backgroundColor: "var(--row-alt)",
              color: "var(--highlight-10)",
              borderTop: "0.5px solid var(--highlight-10)",
              borderBottom: "0.5px solid var(--highlight-10)",
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
          <Chip tone="solid" radius="sm" color="var(--row-alt)" textColor="var(--highlight-10)">
            {label}
          </Chip>
        );
      }
      return <span className="text-highlight-10">-</span>;
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
      if (!ev.status) return <span className="text-body text-highlight-10">-</span>;
      const bg = eventStatusColors[ev.status] ?? "var(--highlight-10)";
      const fg = eventStatusFgColors[ev.status] ?? "var(--surface-60)";
      return (
        <Chip tone="solid" color={bg} textColor={fg} className="capitalize">
          {ev.status.replace("_", " ")}
        </Chip>
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
  const openAvailabilityBlockDrawer = useAppStore((s) => s.openAvailabilityBlockDrawer);
  const anchor = useAppStore((s) => s.calendar.anchor);
  const setTimeframeAnchor = useAppStore((s) => s.setTimeframeAnchor);

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
    <div>
      {/* Mobile-only (below lg): lg+ already has the stepper via SubmenuBar's
          left slot, right above the canvas. Below lg the submenu rail is
          hidden (M.1), so paging through dates otherwise means opening the
          hamburger drawer - put both controls inline instead, same pattern
          as the gantt/agenda views. Sticky + the negative top offset trick
          (see calendar-agenda-view) keeps it reachable while scrolling and
          flush under the top bar, no gap. There's no natural "scroll to
          today" row target here (the list can be sorted by any column), so
          Today just makes sure today's data is in the fetched range. */}
      <div
        className="pt-xs pb-sm sticky lg:hidden"
        style={{
          top: "calc(-1 * (var(--space-md) - 2px))",
          zIndex: 10,
          backgroundColor: "var(--surface-60)",
        }}
      >
        <div className="gap-xs flex items-center justify-center">
          <TimeframeStepper />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              if (anchor !== null) setTimeframeAnchor("calendar", null);
            }}
            className="ml-auto"
          >
            <LocateFixed size={14} aria-hidden="true" />
            Today
          </Button>
        </div>
      </div>
      <SortableList<CalendarEvent>
        columns={columns}
        data={sorted}
        sortKey={sortKey}
        sortDirection={sortDir}
        onSort={handleSort}
        onRowClick={(ev) => {
          if (ev.type === "availability_block") {
            openAvailabilityBlockDrawer(ev.id);
            return;
          }
          openDrillDownPanel(ev.type, ev.id);
        }}
        getRowId={(ev) => `${ev.id}:${ev.listingId}`}
      />
    </div>
  );
}
