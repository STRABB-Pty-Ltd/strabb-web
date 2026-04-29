"use client";

import { KanbanBoard } from "@/components/views/kanban-board";
import type { CleaningTask } from "@/types/cleaning-task";
import { useAppStore } from "@/stores/app-store";

import { CleaningTaskCard } from "./cleaning-task-card";

const statusColumns = [
  { id: "ticket", label: "Tickets" },
  { id: "confirmed", label: "Confirmed" },
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
];

interface CleaningKanbanViewProps {
  tasks: CleaningTask[];
}

export function CleaningKanbanView({ tasks }: CleaningKanbanViewProps) {
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const columns = statusColumns.map((col) => ({
    ...col,
    items: tasks.filter((t) => t.status === col.id),
  }));

  return (
    <KanbanBoard<CleaningTask>
      columns={columns}
      renderCard={(task) => (
        <CleaningTaskCard task={task} onClick={() => openDrillDownPanel("cleaning", task.id)} />
      )}
      getItemId={(task) => task.id}
      getBorderColor={(task) => task.listingColor}
    />
  );
}
