"use client";

import { Monitor } from "lucide-react";

import { ShoppingListPopup } from "@/components/overlays/shopping-list-popup";
import { CleaningCalendarView } from "./_components/cleaning-calendar-view";
import { CleaningKanbanView } from "./_components/cleaning-kanban-view";
import { CleaningListView } from "./_components/cleaning-list-view";
import { useCleaningTasks } from "@/hooks/use-cleaning";
import { useMobileViewOverride } from "@/hooks/use-responsive-view";
import { useAppStore } from "@/stores/app-store";

export default function CleaningPage() {
  const view = useAppStore((s) => s.cleaning.view);
  const submenu = useAppStore((s) => s.cleaning.submenu);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const { effectiveView, showMobileBanner } = useMobileViewOverride(view);

  const { data: tasks, isLoading } = useCleaningTasks(submenu, selectedListings);

  if (isLoading) {
    return (
      <div className="py-xl flex items-center justify-center">
        <p className="text-body text-gray-400">Loading cleaning tasks...</p>
      </div>
    );
  }

  return (
    <div>
      {showMobileBanner && (
        <div className="mb-sm gap-base px-sm py-base text-body flex items-center rounded-lg bg-blue-50 text-blue-700">
          <Monitor size={16} />
          Switch to desktop for Calendar view
        </div>
      )}
      {effectiveView === "kanban" && <CleaningKanbanView tasks={tasks ?? []} />}
      {effectiveView === "calendar" && <CleaningCalendarView tasks={tasks ?? []} />}
      {effectiveView === "list" && <CleaningListView tasks={tasks ?? []} />}

      <ShoppingListPopup />
    </div>
  );
}
