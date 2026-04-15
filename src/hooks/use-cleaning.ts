"use client";

import { useCallback } from "react";

import { USE_MOCK } from "@/lib/mock-data";
import { useCleaningTasksMock, useShoppingListMock } from "@/lib/mock-data/cleaning-hooks";
import {
  useCleaningTasksAPI,
  useShoppingListAPI,
  useUpdateCleaningTaskAPI,
} from "@/lib/api-hooks/cleaning-api";
import { useAppStore } from "@/stores/app-store";
import type { CleaningTask } from "@/types/cleaning-task";

export function useCleaningTasks(submenuFilters: string[], selectedListings: string[]) {
  const mockResult = useCleaningTasksMock(submenuFilters, selectedListings);
  const apiResult = useCleaningTasksAPI(submenuFilters, selectedListings);

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }

  return {
    data: apiResult.data,
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useShoppingList(selectedListings: string[]) {
  const mockResult = useShoppingListMock(selectedListings);
  const apiResult = useShoppingListAPI(selectedListings);

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }

  return {
    data: apiResult.data,
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useCleaningActions() {
  const toggleBoughtItem = useAppStore((s) => s.toggleBoughtItem);
  const updateTaskMutation = useUpdateCleaningTaskAPI();

  const updateTaskStatus = useCallback(
    (id: string, status: string) => {
      if (!USE_MOCK) {
        updateTaskMutation.mutate({ id, data: { status } as Partial<CleaningTask> });
      }
    },
    [updateTaskMutation],
  );

  const assignTask = useCallback(
    (taskId: string, assignee: string) => {
      if (!USE_MOCK) {
        updateTaskMutation.mutate({
          id: taskId,
          data: { assigneeName: assignee } as Partial<CleaningTask>,
        });
      }
    },
    [updateTaskMutation],
  );

  return { updateTaskStatus, toggleBoughtItem, assignTask };
}
