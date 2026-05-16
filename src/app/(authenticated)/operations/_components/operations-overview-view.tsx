"use client";

import { useMemo } from "react";

import { KanbanCard } from "@/components/views/kanban-card";
import { useTicketsAPI } from "@/lib/api-hooks/tickets-api";
import { useProperties } from "@/hooks/use-properties";
import type { CleaningTask } from "@/types/cleaning-task";
import type { Ticket } from "@/types/ticket";
import { useAppStore } from "@/stores/app-store";

import { CleaningTaskCard } from "./cleaning-task-card";
import { SectionPanel } from "./operations-section-panel";
import { TicketKanbanCard } from "./ticket-kanban-card";

interface OperationsOverviewViewProps {
  tasks: CleaningTask[];
}

export function OperationsOverviewView({ tasks }: OperationsOverviewViewProps) {
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
  const ticketConfirmed = useMemo(() => tickets.filter((t) => t.status === "confirmed"), [tickets]);
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

  return (
    <div className="gap-sm flex min-h-full">
      <SectionPanel
        title="Tickets"
        columns={[
          {
            id: "ticket-pending",
            label: "Pending",
            count: ticketPending.length,
            cards: ticketPending.map(renderTicket),
          },
          {
            id: "ticket-confirmed",
            label: "Confirmed",
            count: ticketConfirmed.length,
            cards: ticketConfirmed.map(renderTicket),
          },
        ]}
      />
      <SectionPanel
        title="Cleaning"
        columns={[
          {
            id: "clean-pending",
            label: "Pending",
            count: cleanPending.length,
            cards: cleanPending.map(renderTask),
          },
          {
            id: "clean-confirmed",
            label: "Confirmed",
            count: cleanConfirmed.length,
            cards: cleanConfirmed.map(renderTask),
          },
        ]}
      />
    </div>
  );
}
