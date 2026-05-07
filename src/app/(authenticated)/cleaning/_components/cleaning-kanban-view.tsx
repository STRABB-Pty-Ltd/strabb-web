"use client";

import { useMemo } from "react";

import { KanbanBoard } from "@/components/views/kanban-board";
import { useTicketsAPI } from "@/lib/api-hooks/tickets-api";
import { useProperties } from "@/hooks/use-properties";
import type { CleaningTask } from "@/types/cleaning-task";
import type { Ticket } from "@/types/ticket";
import { useAppStore } from "@/stores/app-store";

import { CleaningTaskCard } from "./cleaning-task-card";
import { TicketKanbanCard } from "./ticket-kanban-card";

type KanbanItem = { kind: "task"; data: CleaningTask } | { kind: "ticket"; data: Ticket };

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

  const columns = useMemo(() => {
    const taskItems: KanbanItem[] = tasks.map((t) => ({ kind: "task", data: t }));
    const ticketItems: KanbanItem[] = tickets.map((t) => ({ kind: "ticket", data: t }));
    // Overview kanban shows operator workload only: Tickets, Confirmed,
    // Pending. Completed tasks aren't actionable - they live in the list
    // view if someone needs to find them.
    return [
      { id: "ticket", label: "Tickets", items: ticketItems },
      {
        id: "confirmed",
        label: "Confirmed",
        items: taskItems.filter((i) => i.kind === "task" && i.data.status === "confirmed"),
      },
      {
        id: "pending",
        label: "Pending",
        items: taskItems.filter((i) => i.kind === "task" && i.data.status === "pending"),
      },
    ];
  }, [tasks, tickets]);

  return (
    <KanbanBoard<KanbanItem>
      columns={columns}
      renderCard={(item) =>
        item.kind === "task" ? (
          <CleaningTaskCard
            task={item.data}
            onClick={() => openDrillDownPanel("cleaning", item.data.id)}
          />
        ) : (
          <TicketKanbanCard
            ticket={item.data}
            propertyName={propertyNames[item.data.propertyId]}
            onClick={() => openDrillDownPanel("ticket", item.data.id)}
          />
        )
      }
      getItemId={(item) => item.data.id}
      getBorderColor={(item) =>
        item.kind === "task" ? item.data.listingColor : "var(--highlight-10)"
      }
    />
  );
}
