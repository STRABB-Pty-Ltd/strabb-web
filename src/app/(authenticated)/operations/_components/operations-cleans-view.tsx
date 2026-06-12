"use client";

import { useMemo } from "react";

import { KanbanCard } from "@/components/views/kanban-card";
import { cleaningStatusColor } from "@/lib/cleaning-status";
import type { CleaningTask } from "@/types/cleaning-task";
import { useAppStore } from "@/stores/app-store";

import { CleaningTaskCard } from "./cleaning-task-card";
import { SectionPanel } from "./operations-section-panel";

interface OperationsCleansViewProps {
  tasks: CleaningTask[];
}

const STATUSES: { id: CleaningTask["status"]; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export function OperationsCleansView({ tasks }: OperationsCleansViewProps) {
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const grouped = useMemo(() => {
    const byStatus: Record<string, CleaningTask[]> = {};
    for (const s of STATUSES) byStatus[s.id] = [];
    for (const t of tasks) {
      if (byStatus[t.status]) byStatus[t.status].push(t);
    }
    return byStatus;
  }, [tasks]);

  const renderTask = (t: CleaningTask) => (
    <KanbanCard key={t.id} borderColor={cleaningStatusColor(t.status)}>
      <CleaningTaskCard task={t} onClick={() => openDrillDownPanel("cleaning", t.id)} />
    </KanbanCard>
  );

  return (
    <div className="flex min-h-full">
      <SectionPanel
        title="Cleaning"
        columns={STATUSES.map((s) => ({
          id: `clean-${s.id}`,
          label: s.label,
          count: grouped[s.id].length,
          cards: grouped[s.id].map(renderTask),
        }))}
      />
    </div>
  );
}
