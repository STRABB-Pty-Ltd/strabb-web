"use client";

import { useMemo } from "react";

import { KanbanCard } from "@/components/views/kanban-card";
import { useTicketsAPI } from "@/lib/api-hooks/tickets-api";
import { useProperties } from "@/hooks/use-properties";
import type { CleaningTask } from "@/types/cleaning-task";
import type { Ticket } from "@/types/ticket";
import { useAppStore } from "@/stores/app-store";

import { CleaningTaskCard } from "./cleaning-task-card";
import { TicketKanbanCard } from "./ticket-kanban-card";

interface CleaningKanbanViewProps {
  tasks: CleaningTask[];
}

interface SectionPanelProps {
  title: string;
  pendingLabel?: string;
  confirmedLabel?: string;
  pendingCount: number;
  confirmedCount: number;
  pendingCards: React.ReactNode;
  confirmedCards: React.ReactNode;
}

function SectionPanel({
  title,
  pendingLabel = "Pending",
  confirmedLabel = "Confirmed",
  pendingCount,
  confirmedCount,
  pendingCards,
  confirmedCards,
}: SectionPanelProps) {
  return (
    <section
      className="p-md flex min-w-0 flex-1 flex-col rounded-xl"
      style={{ backgroundColor: "var(--neutral-30)" }}
    >
      <h3
        className="mb-sm text-subheading text-center font-semibold"
        style={{ color: "var(--highlight-10)" }}
      >
        {title}
      </h3>
      <div className="gap-sm flex flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <SubColumnHeader label={pendingLabel} count={pendingCount} />
          <div className="gap-base pt-base flex flex-col">{pendingCards}</div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <SubColumnHeader label={confirmedLabel} count={confirmedCount} />
          <div className="gap-base pt-base flex flex-col">{confirmedCards}</div>
        </div>
      </div>
    </section>
  );
}

function SubColumnHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      className="gap-base px-base py-base flex items-center border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <span className="text-body text-highlight-10 font-semibold">{label}</span>
      <span className="px-base py-xs text-body bg-surface-60 text-highlight-10 rounded-full font-medium">
        {count}
      </span>
    </div>
  );
}

export function CleaningKanbanView({ tasks }: CleaningKanbanViewProps) {
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);
  const selectedListings = useAppStore((s) => s.selectedListings);

  const { data: ticketsResponse } = useTicketsAPI({ pageSize: 100 });
  const { data: propertiesData } = useProperties();

  const propertyNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const p of propertiesData?.data ?? []) names[p.id] = p.name;
    return names;
  }, [propertiesData]);

  const tickets = useMemo(() => {
    const all = ticketsResponse?.data ?? [];
    if (selectedListings.length === 0) return all;
    return all.filter((t) => t.listingId && selectedListings.includes(t.listingId));
  }, [ticketsResponse, selectedListings]);

  const ticketPending = useMemo(() => tickets.filter((t) => t.status === "pending"), [tickets]);
  const ticketConfirmed = useMemo(
    () => tickets.filter((t) => t.status === "confirmed"),
    [tickets],
  );
  const cleanPending = useMemo(() => tasks.filter((t) => t.status === "pending"), [tasks]);
  const cleanConfirmed = useMemo(() => tasks.filter((t) => t.status === "confirmed"), [tasks]);

  const renderTicket = (t: Ticket) => (
    <KanbanCard key={t.id} borderColor="var(--highlight-10)">
      <TicketKanbanCard
        ticket={t}
        propertyName={propertyNames[t.propertyId]}
        onClick={() => openDrillDownPanel("ticket", t.id)}
      />
    </KanbanCard>
  );

  const renderTask = (t: CleaningTask) => (
    <KanbanCard key={t.id} borderColor={t.listingColor}>
      <CleaningTaskCard task={t} onClick={() => openDrillDownPanel("cleaning", t.id)} />
    </KanbanCard>
  );

  // 233 = next Fibonacci step beyond --space-xl, design-locked.
  return (
    <div className="no-scrollbar overflow-auto" style={{ maxHeight: "calc(100vh - 233px)" }}>
      <div className="gap-sm pb-sm flex">
        <SectionPanel
          title="Tickets"
          pendingCount={ticketPending.length}
          confirmedCount={ticketConfirmed.length}
          pendingCards={ticketPending.map(renderTicket)}
          confirmedCards={ticketConfirmed.map(renderTicket)}
        />
        <SectionPanel
          title="Cleaning"
          pendingCount={cleanPending.length}
          confirmedCount={cleanConfirmed.length}
          pendingCards={cleanPending.map(renderTask)}
          confirmedCards={cleanConfirmed.map(renderTask)}
        />
      </div>
    </div>
  );
}
