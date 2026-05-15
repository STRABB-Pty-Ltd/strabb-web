"use client";

import { useMemo } from "react";

import { KanbanCard } from "@/components/views/kanban-card";
import { KanbanColumn } from "@/components/views/kanban-column";
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

  // Two top-level sections (Tickets, Cleaning) at 50/50 width. Each carries
  // its own Pending/Confirmed sub-columns. One outer scroll container so the
  // two sections track together vertically.
  // 233 = next Fibonacci step beyond --space-xl, design-locked.
  return (
    <div className="no-scrollbar overflow-auto" style={{ maxHeight: "calc(100vh - 233px)" }}>
      <div className="gap-sm pb-sm flex">
        <section className="gap-sm flex min-w-0 flex-1 flex-col">
          <h2 className="px-base text-body text-highlight-10 font-semibold">Tickets</h2>
          <div className="gap-sm flex flex-1">
            <KanbanColumn id="ticket-pending" label="Pending" count={ticketPending.length}>
              {ticketPending.map(renderTicket)}
            </KanbanColumn>
            <KanbanColumn id="ticket-confirmed" label="Confirmed" count={ticketConfirmed.length}>
              {ticketConfirmed.map(renderTicket)}
            </KanbanColumn>
          </div>
        </section>

        <section className="gap-sm flex min-w-0 flex-1 flex-col">
          <h2 className="px-base text-body text-highlight-10 font-semibold">Cleaning</h2>
          <div className="gap-sm flex flex-1">
            <KanbanColumn id="clean-pending" label="Pending" count={cleanPending.length}>
              {cleanPending.map(renderTask)}
            </KanbanColumn>
            <KanbanColumn id="clean-confirmed" label="Confirmed" count={cleanConfirmed.length}>
              {cleanConfirmed.map(renderTask)}
            </KanbanColumn>
          </div>
        </section>
      </div>
    </div>
  );
}
