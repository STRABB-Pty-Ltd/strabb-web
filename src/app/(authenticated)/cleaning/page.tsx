"use client";

import { Monitor, Wrench } from "lucide-react";
import Link from "next/link";

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

  const { data: tasks, isLoading } = useCleaningTasks(submenu, selectedListings);

  const headerLink = (
    <div className="mb-sm flex justify-end">
      <Link
        href="/properties/maintenance"
        className="gap-xs px-sm py-xs text-body inline-flex items-center rounded-lg border font-medium text-gray-700 hover:bg-gray-50"
        style={{ borderColor: "var(--border)" }}
      >
        <Wrench size={14} />
        Maintenance
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {headerLink}
        <div className="py-xl flex items-center justify-center">
          <p className="text-body text-gray-400">Loading cleaning tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {headerLink}
      {showMobileBanner && (
        <div className="mb-sm gap-base px-sm py-base text-body flex items-center rounded-lg bg-blue-50 text-blue-700">
          <Monitor size={16} />
          Switch to desktop for Gantt/Calendar view
        </div>
      )}
      {effectiveView === "kanban" && <CleaningKanbanView tasks={tasks ?? []} />}
      {effectiveView === "calendar" && <CleaningCalendarView tasks={tasks ?? []} />}
      {effectiveView === "list" && <CleaningListView tasks={tasks ?? []} />}
      {effectiveView === "gantt" && <CleaningGanttView tasks={tasks ?? []} />}

      <ShoppingListPopup />
    </div>
  );
}
