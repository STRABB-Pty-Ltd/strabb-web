"use client";

import { useMemo } from "react";

import { mockCleaningTaskList, mockShoppingItemList } from "./index";

export function useCleaningTasksMock(submenuFilters: string[], selectedListings: string[]) {
  return useMemo(() => {
    let tasks = [...mockCleaningTaskList];

    if (selectedListings.length > 0) {
      tasks = tasks.filter((t) => selectedListings.includes(t.listingId));
    }

    const showAll = submenuFilters.length === 0 || submenuFilters.includes("overview");
    if (!showAll) {
      const statusMap: Record<string, string> = {
        confirmed: "confirmed",
        pending: "pending",
        archived: "completed",
      };
      const statusFilters = submenuFilters.map((f) => statusMap[f]).filter(Boolean);
      if (statusFilters.length > 0) {
        tasks = tasks.filter((t) => statusFilters.includes(t.status));
      }
    }

    return tasks;
  }, [submenuFilters, selectedListings]);
}

export function useShoppingListMock(selectedListings: string[]) {
  return useMemo(() => {
    if (selectedListings.length > 0) {
      return mockShoppingItemList.filter((i) => selectedListings.includes(i.listingId));
    }
    return mockShoppingItemList;
  }, [selectedListings]);
}
