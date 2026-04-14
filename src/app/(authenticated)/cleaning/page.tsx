"use client";

import { Monitor } from "lucide-react";

import { ShoppingListPopup } from "@/components/overlays/shopping-list-popup";
import { CleaningCalendarView } from "@/components/pages/cleaning/cleaning-calendar-view";
import { CleaningGanttView } from "@/components/pages/cleaning/cleaning-gantt-view";
import { CleaningKanbanView } from "@/components/pages/cleaning/cleaning-kanban-view";
import { CleaningListView } from "@/components/pages/cleaning/cleaning-list-view";
import { useCleaningTasks } from "@/hooks/use-cleaning";
import { useMobileViewOverride } from "@/hooks/use-responsive-view";
import { useAppStore } from "@/stores/app-store";

export default function CleaningPage() {
  const view = useAppStore((s) => s.cleaning.view);
  const submenu = useAppStore((s) => s.cleaning.submenu);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const { effectiveView, showMobileBanner } = useMobileViewOverride(view);

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
      {showMobileBanner && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <Monitor size={16} />
          Switch to desktop for Gantt/Calendar view
        </div>
      )}
      {effectiveView === "kanban" && <CleaningKanbanView tasks={tasks} />}
      {effectiveView === "calendar" && <CleaningCalendarView tasks={tasks} />}
      {effectiveView === "list" && <CleaningListView tasks={tasks} />}
      {effectiveView === "gantt" && <CleaningGanttView tasks={tasks} />}

      <ShoppingListPopup />
    </div>
  );
}
