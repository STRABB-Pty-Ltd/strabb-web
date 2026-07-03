"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import type {
  AvailabilityResponse,
  PortalTask,
  PortalWindow,
  TimeOffInput,
  TransitionInput,
  WeeklyAvailability,
} from "@/lib/schemas/portal";
import { TRANSITION_TARGET_STATUS } from "@/lib/schemas/portal";

/**
 * Cleaner-portal data hooks (Phase D1). Queries hit the CLEANER-only /portal/*
 * endpoints; the api enforces assigned_user_id == current_user and returns a
 * PortalTaskResponse that carries no financial/PII fields. List reads follow the
 * repo's { data } envelope; the detail read and mutations return the resource
 * (or nothing) directly. The transition mutation is the one place in the app
 * that writes optimistically: a cleaner tapping accept/start/complete on their
 * phone should feel instant, and a stale-state 409 rolls the cache straight back
 * before an onSettled refetch reconciles with the server.
 */

export const PORTAL_TASKS_KEY = ["portal", "tasks"] as const;
export const PORTAL_AVAILABILITY_KEY = ["portal", "availability"] as const;

export function portalTaskKey(id: string): readonly [string, string, string] {
  return ["portal", "tasks", id];
}

export function usePortalTasks(
  window: PortalWindow,
  status?: string,
  options?: { enabled?: boolean },
) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const params = new URLSearchParams();
  params.set("window", window);
  if (status) params.set("status", status);

  return useQuery<PortalTask[]>({
    queryKey: [...PORTAL_TASKS_KEY, window, status ?? "all"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PortalTask[] }>(`/portal/tasks?${params.toString()}`);
      return res.data;
    },
    // Gate on both auth readiness and the caller's opt-in so a hidden window
    // (e.g. Past) does not fetch until the cleaner switches to it.
    enabled: isReady && (options?.enabled ?? true),
  });
}

export function usePortalTask(id: string) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<PortalTask>({
    queryKey: portalTaskKey(id),
    queryFn: async () => {
      const res = await apiClient.get<{ data: PortalTask }>(`/portal/tasks/${id}`);
      return res.data;
    },
    enabled: isReady && !!id,
  });
}

interface TransitionContext {
  previous?: PortalTask;
}

export function useTransitionTask(id: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation<PortalTask, unknown, TransitionInput, TransitionContext>({
    mutationFn: (input) => apiClient.post<PortalTask>(`/portal/tasks/${id}/transition`, input),
    onMutate: async (input) => {
      // Optimistically advance the cached task so the button state and status
      // chip update instantly, before the round-trip completes.
      await queryClient.cancelQueries({ queryKey: portalTaskKey(id) });
      const previous = queryClient.getQueryData<PortalTask>(portalTaskKey(id));
      if (previous) {
        queryClient.setQueryData<PortalTask>(portalTaskKey(id), {
          ...previous,
          status: TRANSITION_TARGET_STATUS[input.action],
        });
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      // A 409 (task already moved in another tab) or any failure rolls the
      // cache back to the pre-mutation value; the caller surfaces the error.
      if (context?.previous) {
        queryClient.setQueryData(portalTaskKey(id), context.previous);
      }
    },
    onSettled: () => {
      // Reconcile with the server regardless of success/failure: the list and
      // the detail both refetch so the true status wins.
      queryClient.invalidateQueries({ queryKey: portalTaskKey(id) });
      queryClient.invalidateQueries({ queryKey: PORTAL_TASKS_KEY });
    },
  });
}

export function useAvailability() {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<AvailabilityResponse>({
    queryKey: PORTAL_AVAILABILITY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<{ data: AvailabilityResponse }>("/portal/availability");
      return res.data;
    },
    enabled: isReady,
  });
}

export function useUpdateWeeklyAvailability() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    // Replace-set: the full weekly list is sent; an empty array clears it.
    mutationFn: (weekly: WeeklyAvailability[]) =>
      apiClient.put("/portal/availability/weekly", { weekly }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PORTAL_AVAILABILITY_KEY });
    },
  });
}

export function useAddTimeOff() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TimeOffInput) => apiClient.post("/portal/availability/time-off", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PORTAL_AVAILABILITY_KEY });
    },
  });
}

export function useDeleteTimeOff() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/portal/availability/time-off/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PORTAL_AVAILABILITY_KEY });
    },
  });
}
