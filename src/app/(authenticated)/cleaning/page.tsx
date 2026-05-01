"use client";

import { useMemo } from "react";

import { ShoppingListPopup } from "@/components/overlays/shopping-list-popup";
import { Skeleton } from "@/components/ui/skeleton";
import { CleaningKanbanView } from "./_components/cleaning-kanban-view";
import { CleaningListView } from "./_components/cleaning-list-view";
import { useCleaningTasks } from "@/hooks/use-cleaning";
import { useListings } from "@/hooks/use-listings";
import { useProperties } from "@/hooks/use-properties";
import { useAppStore } from "@/stores/app-store";

export default function CleaningPage() {
  const view = useAppStore((s) => s.cleaning.view);
  const submenu = useAppStore((s) => s.cleaning.submenu);
  const selectedListings = useAppStore((s) => s.selectedListings);

  const { data: tasks, isLoading } = useCleaningTasks(submenu, selectedListings);
  const { data: listingsData } = useListings();
  const { data: propertiesData } = useProperties();

  const listingTimezones = useMemo(() => {
    const tz: Record<string, string> = {};
    const propertyTzMap: Record<string, string> = {};
    for (const p of propertiesData?.data ?? []) propertyTzMap[p.id] = p.timezone;
    for (const l of listingsData?.data ?? []) {
      const propTz = propertyTzMap[l.propertyId];
      if (propTz) tz[l.id] = propTz;
    }
    return tz;
  }, [propertiesData, listingsData]);

  if (isLoading) {
    return (
      <div className="space-y-xs" aria-busy="true">
        <span className="sr-only">Loading cleaning tasks</span>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} h={55} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {view === "kanban" && <CleaningKanbanView tasks={tasks ?? []} />}
      {view === "list" && (
        <CleaningListView tasks={tasks ?? []} listingTimezones={listingTimezones} />
      )}

      <ShoppingListPopup />
    </div>
  );
}
