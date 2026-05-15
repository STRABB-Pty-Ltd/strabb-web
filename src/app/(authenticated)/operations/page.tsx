"use client";

import { ShoppingListPopup } from "@/components/overlays/shopping-list-popup";
import { Skeleton } from "@/components/ui/skeleton";
import { useCleaningTasks } from "@/hooks/use-cleaning";
import { useAppStore } from "@/stores/app-store";

import { OperationsCleansView } from "./_components/operations-cleans-view";
import { OperationsOverviewView } from "./_components/operations-overview-view";
import { OperationsTicketsView } from "./_components/operations-tickets-view";

export default function OperationsPage() {
  const submenu = useAppStore((s) => s.operations.submenu);
  const selectedListings = useAppStore((s) => s.selectedListings);

  // Submenu drives which kanban shape renders. Cleans data is fetched up here
  // so Overview and Cleaning chips share the same query. Tickets view runs
  // its own fetch because its query shape differs (no submenu filters).
  const { data: tasks, isLoading } = useCleaningTasks([], selectedListings);

  if (isLoading) {
    return (
      <div className="space-y-xs" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading operations</span>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} h={55} />
        ))}
      </div>
    );
  }

  const active = submenu[0] ?? "overview";

  return (
    <div className="h-full">
      {active === "overview" && <OperationsOverviewView tasks={tasks ?? []} />}
      {active === "cleaning" && <OperationsCleansView tasks={tasks ?? []} />}
      {active === "tickets" && <OperationsTicketsView />}

      <ShoppingListPopup />
    </div>
  );
}
