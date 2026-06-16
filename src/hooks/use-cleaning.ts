"use client";

import { useCallback } from "react";

import {
  useCleaningTasksAPI,
  useShoppingListAPI,
  useUpdateCleaningTaskAPI,
} from "@/lib/api-hooks/cleaning-api";
import type { CleaningTask } from "@/types/cleaning-task";

export function useCleaningTasks(submenuFilters: string[], selectedListings: string[]) {
  const apiResult = useCleaningTasksAPI(submenuFilters, selectedListings);

  return {
    data: apiResult.data,
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useShoppingList(selectedListings: string[]) {
  const apiResult = useShoppingListAPI(selectedListings);

  return {
    data: apiResult.data,
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useCleaningActions() {
  const updateTaskMutation = useUpdateCleaningTaskAPI();

  const updateTaskStatus = useCallback(
    (id: string, status: string) => {
      updateTaskMutation.mutate({ id, data: { status } as Partial<CleaningTask> });
    },
    [updateTaskMutation],
  );

  const assignTask = useCallback(
    (taskId: string, assignee: string) => {
      updateTaskMutation.mutate({
        id: taskId,
        data: { cleanerName: assignee } as Partial<CleaningTask>,
      });
    },
    [updateTaskMutation],
  );

  return { updateTaskStatus, assignTask };
}
