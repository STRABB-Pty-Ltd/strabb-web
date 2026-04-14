"use client";

import { ShoppingListPopup } from "@/components/overlays/shopping-list-popup";
import { CleaningCalendarView } from "@/components/pages/cleaning/cleaning-calendar-view";
import { CleaningGanttView } from "@/components/pages/cleaning/cleaning-gantt-view";
import { CleaningKanbanView } from "@/components/pages/cleaning/cleaning-kanban-view";
import { CleaningListView } from "@/components/pages/cleaning/cleaning-list-view";
import { useCleaningTasks } from "@/hooks/use-cleaning";
import { useAppStore } from "@/stores/app-store";

export default function CleaningPage() {
  const view = useAppStore((s) => s.cleaning.view);
  const submenu = useAppStore((s) => s.cleaning.submenu);
  const selectedListings = useAppStore((s) => s.selectedListings);

  const { data: tasks, isLoading } = useCleaningTasks(
    submenu,
    selectedListings,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">Loading cleaning tasks...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {view === "kanban" && <CleaningKanbanView tasks={tasks} />}
      {view === "calendar" && <CleaningCalendarView tasks={tasks} />}
      {view === "list" && <CleaningListView tasks={tasks} />}
      {view === "gantt" && <CleaningGanttView tasks={tasks} />}

      <ShoppingListPopup />
    </div>
  );
}
