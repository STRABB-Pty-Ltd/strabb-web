"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KanbanCard } from "@/components/views/kanban-card";
import { useProperties } from "@/hooks/use-properties";
import { useTicketsAPI } from "@/lib/api-hooks/tickets-api";
import type { Ticket, TicketStatus } from "@/types/ticket";
import { useAppStore } from "@/stores/app-store";

import { SectionPanel } from "./operations-section-panel";
import { TicketFormDialog } from "./ticket-form-dialog";
import { TicketKanbanCard } from "./ticket-kanban-card";

const STATUSES: { id: TicketStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export function OperationsTicketsView() {
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const grouped = useMemo(() => {
    const byStatus: Record<string, Ticket[]> = {};
    for (const s of STATUSES) byStatus[s.id] = [];
    for (const t of tickets) {
      if (byStatus[t.status]) byStatus[t.status].push(t);
    }
    return byStatus;
  }, [tickets]);

  const renderTicket = (t: Ticket) => (
    <KanbanCard key={t.id} borderColor="var(--highlight-10)">
      <TicketKanbanCard
        ticket={t}
        propertyName={propertyNames[t.propertyId]}
        onClick={() => openDrillDownPanel("ticket", t.id)}
      />
    </KanbanCard>
  );

  return (
    <div className="gap-sm flex min-h-full flex-col">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus size={13} aria-hidden="true" />
          Add ticket
        </Button>
      </div>
      <div className="flex min-h-0 flex-1">
        <SectionPanel
          title="Tickets"
          columns={STATUSES.map((s) => ({
            id: `ticket-${s.id}`,
            label: s.label,
            count: grouped[s.id].length,
            cards: grouped[s.id].map(renderTicket),
          }))}
        />
      </div>
      <TicketFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
