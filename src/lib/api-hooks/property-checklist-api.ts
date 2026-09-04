"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { propertyChecklistKey } from "@/hooks/use-default-checklist";
import { useApiClient } from "@/hooks/use-api-client";
import type { PropertyChecklistItem } from "@/lib/schemas/property-checklist";

/**
 * Per-property checklist mutations (Settings > Listings > General). The query
 * lives in hooks/use-default-checklist.ts; every mutation invalidates that
 * property's key so the editor refreshes. Errors are surfaced by the caller
 * (meta.suppressGlobalError) as a toast next to the control that triggered it.
 *
 * The checklist is its own resource, saved by these mutations - independent of
 * the property's other settings and their Save buttons.
 */

interface DataEnvelope<T> {
  data: T;
}

interface ChecklistCache {
  data: PropertyChecklistItem[];
}

// Reorder items to match itemIds, reassigning position by index. Exported for
// unit testing the optimistic reorder computation.
export function applyOrder(
  items: PropertyChecklistItem[],
  itemIds: string[],
): PropertyChecklistItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered: PropertyChecklistItem[] = [];
  itemIds.forEach((id, index) => {
    const item = byId.get(id);
    if (item) ordered.push({ ...item, position: index });
  });
  return ordered;
}

export function useAddPropertyItem() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyId,
      label,
      description,
    }: {
      propertyId: string;
      label: string;
      description?: string | null;
    }) =>
      apiClient.post<DataEnvelope<PropertyChecklistItem>>(
        `/properties/${propertyId}/checklist/items`,
        { label, description },
      ),
    meta: { suppressGlobalError: true },
    onSuccess: (_data, { propertyId }) =>
      queryClient.invalidateQueries({ queryKey: propertyChecklistKey(propertyId) }),
  });
}

export function useUpdatePropertyItem() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  // label and description are each optional: omit to leave a field unchanged,
  // send description: null to clear it. undefined fields drop out of the JSON.
  return useMutation({
    mutationFn: ({
      propertyId,
      itemId,
      label,
      description,
    }: {
      propertyId: string;
      itemId: string;
      label?: string;
      description?: string | null;
    }) =>
      apiClient.put<DataEnvelope<PropertyChecklistItem>>(
        `/properties/${propertyId}/checklist/items/${itemId}`,
        { label, description },
      ),
    meta: { suppressGlobalError: true },
    onSuccess: (_data, { propertyId }) =>
      queryClient.invalidateQueries({ queryKey: propertyChecklistKey(propertyId) }),
  });
}

export function useDeletePropertyItem() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, itemId }: { propertyId: string; itemId: string }) =>
      apiClient.delete<void>(`/properties/${propertyId}/checklist/items/${itemId}`),
    meta: { suppressGlobalError: true },
    onSuccess: (_data, { propertyId }) =>
      queryClient.invalidateQueries({ queryKey: propertyChecklistKey(propertyId) }),
  });
}

// The client keysToSnake-converts itemIds -> item_ids for the api's reorder
// request. Optimistic: the cache is reordered on drop so the row does not snap
// back before the server responds; rolled back on error, reconciled on settle.
export function useReorderPropertyItems() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, itemIds }: { propertyId: string; itemIds: string[] }) =>
      apiClient.put<DataEnvelope<PropertyChecklistItem[]>>(
        `/properties/${propertyId}/checklist/reorder`,
        { itemIds },
      ),
    meta: { suppressGlobalError: true },
    onMutate: async ({ propertyId, itemIds }) => {
      const key = propertyChecklistKey(propertyId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ChecklistCache>(key);
      if (previous) {
        queryClient.setQueryData<ChecklistCache>(key, {
          ...previous,
          data: applyOrder(previous.data, itemIds),
        });
      }
      return { previous, key };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: (_data, _err, { propertyId }) =>
      queryClient.invalidateQueries({ queryKey: propertyChecklistKey(propertyId) }),
  });
}

export function useApplyTemplate() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, templateId }: { propertyId: string; templateId: string }) =>
      apiClient.post<DataEnvelope<PropertyChecklistItem[]>>(
        `/properties/${propertyId}/checklist/apply-template`,
        { templateId },
      ),
    meta: { suppressGlobalError: true },
    onSuccess: (_data, { propertyId }) =>
      queryClient.invalidateQueries({ queryKey: propertyChecklistKey(propertyId) }),
  });
}
