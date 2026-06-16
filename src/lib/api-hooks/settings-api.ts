"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import { useAppStore } from "@/stores/app-store";

export function useSettingsSectionAPI<T = Record<string, unknown>>(section: string) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<T>({
    queryKey: ["settings", section],
    queryFn: async () => {
      const response = await apiClient.get<{ data: T }>(`/settings/${section}`);
      return response.data;
    },
    enabled: isReady,
  });
}

export function useUpdateSettingsSectionAPI<T = Record<string, unknown>>(section: string) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: T) => apiClient.put<{ data: unknown }>(`/settings/${section}`, data),
    onSuccess: (result) => {
      // Seed the cache straight from the PUT response (the freshly-saved record)
      // so the section can't flicker back to stale data before a refetch lands,
      // and we skip the redundant GET entirely.
      queryClient.setQueryData(["settings", section], result.data);
    },
  });
}

interface SettingsForm<T> {
  /** Defaults <- saved server values <- unsaved user edits, merged in that order. */
  values: T;
  /** Merge an edit into the working draft: an object, or an updater given the current values. */
  patch: (partial: Partial<T> | ((current: T) => Partial<T>)) => void;
  /** Persist the current values to /settings/{section}. */
  save: () => void;
  isLoading: boolean;
  isSaving: boolean;
  /** True when the working values differ from what's saved on the server. */
  dirty: boolean;
}

/**
 * Form state for a single Settings section, wired to real persistence.
 *
 * The server stores each section as a free-form JSON blob keyed by section
 * name (GET/PUT /settings/{section}, response shape { settings: {...} }). The
 * api-client camelCases responses and snake_cases requests, so callers work in
 * camelCase throughout and the DB ends up with conventional snake_case keys.
 *
 * `values` is derived (defaults <- server <- draft) rather than synced via
 * useEffect, so there's no race between mount and the settings fetch arriving -
 * same approach as the inbox subdomain draft.
 */
export function useSettingsForm<T extends Record<string, unknown>>(
  section: string,
  defaults: T,
): SettingsForm<T> {
  const { data, isLoading } = useSettingsSectionAPI<{ settings?: Partial<T> }>(section);
  const update = useUpdateSettingsSectionAPI<{ settings: T }>(section);
  const addToast = useAppStore((s) => s.addToast);

  // null = mirror the server. Any object = the user has unsaved edits.
  const [draft, setDraft] = useState<Partial<T> | null>(null);

  const saved = { ...defaults, ...(data?.settings ?? {}) } as T;
  const values = { ...saved, ...(draft ?? {}) } as T;
  const dirty = draft !== null && JSON.stringify(values) !== JSON.stringify(saved);

  const patch = (partial: Partial<T> | ((current: T) => Partial<T>)) => {
    // Ignore edits while a save is in flight: save() clears the draft on success,
    // so a mid-save edit would otherwise be silently discarded.
    if (update.isPending) return;
    setDraft((d) => {
      const current = { ...saved, ...(d ?? {}) } as T;
      const next = typeof partial === "function" ? partial(current) : partial;
      return { ...(d ?? {}), ...next };
    });
  };

  const save = () => {
    update.mutate(
      { settings: values },
      {
        onSuccess: () => {
          // Drop the draft so values mirror the freshly-saved server state.
          setDraft(null);
          addToast({ type: "success", message: "Settings saved" });
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : "Failed to save settings";
          addToast({ type: "error", message });
        },
      },
    );
  };

  return { values, patch, save, isLoading, isSaving: update.isPending, dirty };
}
