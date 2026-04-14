"use client";

import { useCallback, useMemo } from "react";

import {
  USE_MOCK,
  mockCleaningTaskList,
  mockShoppingItemList,
} from "@/lib/mock-data";
import type { CleaningTask } from "@/types/cleaning-task";
import type { ShoppingItem } from "@/types/shopping-item";
import { useAppStore } from "@/stores/app-store";

import { useAuthenticatedQuery } from "./use-authenticated-query";

export function useCleaningTasks(
  submenuFilters: string[],
  selectedListings: string[],
) {
  const mockResult = useMemo(() => {
    let tasks = [...mockCleaningTaskList];

    if (selectedListings.length > 0) {
      tasks = tasks.filter((t) => selectedListings.includes(t.listingId));
    }

    const showAll =
      submenuFilters.length === 0 || submenuFilters.includes("overview");
    if (!showAll) {
      const statusMap: Record<string, string> = {
        tickets: "pending",
        confirmed: "confirmed",
        pending: "pending",
        archived: "completed",
      };
      const statusFilters = submenuFilters
        .map((f) => statusMap[f])
        .filter(Boolean);
      if (statusFilters.length > 0) {
        tasks = tasks.filter((t) => statusFilters.includes(t.status));
      }
    }

    return tasks;
  }, [submenuFilters, selectedListings]);

  const apiResult = useAuthenticatedQuery<CleaningTask[]>(
    ["cleaning-tasks", ...submenuFilters, ...selectedListings],
    "/cleaning/tasks",
    { enabled: !USE_MOCK },
  );

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }
  return {
    data: apiResult.data ?? [],
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useShoppingList(selectedListings: string[]) {
  const mockResult = useMemo(() => {
    if (selectedListings.length > 0) {
      return mockShoppingItemList.filter((i) =>
        selectedListings.includes(i.listingId),
      );
    }
    return mockShoppingItemList;
  }, [selectedListings]);

  const apiResult = useAuthenticatedQuery<ShoppingItem[]>(
    ["shopping-list", ...selectedListings],
    "/cleaning/shopping-list",
    { enabled: !USE_MOCK },
  );

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }
  return {
    data: apiResult.data ?? [],
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useCleaningActions() {
  const toggleBoughtItem = useAppStore((s) => s.toggleBoughtItem);

  const updateTaskStatus = useCallback(
    (_id: string, _status: string) => {
      // Mock: no-op. API mode would PUT /cleaning/tasks/{id}/status
    },
    [],
  );

  const assignTask = useCallback(
    (_taskId: string, _assignee: string) => {
      // Mock: no-op. API mode would PUT /cleaning/tasks/{id}/assign
    },
    [],
  );

  return { updateTaskStatus, toggleBoughtItem, assignTask };
}
