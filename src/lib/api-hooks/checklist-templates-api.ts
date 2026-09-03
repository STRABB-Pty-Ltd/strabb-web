"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CHECKLIST_TEMPLATES_KEY } from "@/hooks/use-checklist-templates";
import { useApiClient } from "@/hooks/use-api-client";
import type { ChecklistItem, ChecklistTemplate } from "@/lib/schemas/checklist-template";

/**
 * Checklist template mutations for Settings > Cleaning. The query lives in
 * hooks/use-checklist-templates.ts; every mutation invalidates its key so the
 * template list and nested item editor refresh. Errors are surfaced by the
 * caller (meta.suppressGlobalError) so a failure lands as a toast next to the
 * control that triggered it.
 *
 * Templates are a resource of their own, saved by these mutations - separate
 * from the cleaning settings blob and its "Save Changes" button.
 */

interface DataEnvelope<T> {
  data: T;
}

function useInvalidateTemplates() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CHECKLIST_TEMPLATES_KEY });
}

export function useCreateTemplate() {
  const apiClient = useApiClient();
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: (data: { name: string; items?: { label: string }[] }) =>
      apiClient.post<DataEnvelope<ChecklistTemplate>>("/checklist-templates", data),
    meta: { suppressGlobalError: true },
    onSuccess: invalidate,
  });
}

export function useRenameTemplate() {
  const apiClient = useApiClient();
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiClient.put<DataEnvelope<ChecklistTemplate>>(`/checklist-templates/${id}`, { name }),
    meta: { suppressGlobalError: true },
    onSuccess: invalidate,
  });
}

export function useDeleteTemplate() {
  const apiClient = useApiClient();
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/checklist-templates/${id}`),
    meta: { suppressGlobalError: true },
    onSuccess: invalidate,
  });
}

export function useAddItem() {
  const apiClient = useApiClient();
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: ({
      templateId,
      label,
      description,
    }: {
      templateId: string;
      label: string;
      description?: string | null;
    }) =>
      apiClient.post<DataEnvelope<ChecklistItem>>(`/checklist-templates/${templateId}/items`, {
        label,
        description,
      }),
    meta: { suppressGlobalError: true },
    onSuccess: invalidate,
  });
}

export function useUpdateItem() {
  const apiClient = useApiClient();
  const invalidate = useInvalidateTemplates();

  // label and description are each optional: omit to leave a field unchanged,
  // send description: null to clear it. undefined fields drop out of the JSON.
  return useMutation({
    mutationFn: ({
      templateId,
      itemId,
      label,
      description,
    }: {
      templateId: string;
      itemId: string;
      label?: string;
      description?: string | null;
    }) =>
      apiClient.put<DataEnvelope<ChecklistItem>>(
        `/checklist-templates/${templateId}/items/${itemId}`,
        { label, description },
      ),
    meta: { suppressGlobalError: true },
    onSuccess: invalidate,
  });
}

export function useDeleteItem() {
  const apiClient = useApiClient();
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: ({ templateId, itemId }: { templateId: string; itemId: string }) =>
      apiClient.delete<void>(`/checklist-templates/${templateId}/items/${itemId}`),
    meta: { suppressGlobalError: true },
    onSuccess: invalidate,
  });
}

interface TemplatesCache {
  data: ChecklistTemplate[];
  meta?: unknown;
}

// Reorder a template's items to match itemIds, reassigning position by index.
// Exported for unit testing the optimistic reorder computation.
export function applyOrder(items: ChecklistItem[], itemIds: string[]): ChecklistItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered: ChecklistItem[] = [];
  itemIds.forEach((id, index) => {
    const item = byId.get(id);
    if (item) ordered.push({ ...item, position: index });
  });
  return ordered;
}

// The client keysToSnake-converts itemIds -> item_ids, which is what the api's
// ChecklistReorderRequest expects (the full item set in the desired order).
// Optimistic: the cache is reordered on drop so the row does not snap back
// before the server responds; rolled back on error, reconciled on settle.
export function useReorderItems() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, itemIds }: { templateId: string; itemIds: string[] }) =>
      apiClient.put<DataEnvelope<ChecklistTemplate>>(`/checklist-templates/${templateId}/reorder`, {
        itemIds,
      }),
    meta: { suppressGlobalError: true },
    onMutate: async ({ templateId, itemIds }) => {
      await queryClient.cancelQueries({ queryKey: CHECKLIST_TEMPLATES_KEY });
      const previous = queryClient.getQueryData<TemplatesCache>(CHECKLIST_TEMPLATES_KEY);
      if (previous) {
        queryClient.setQueryData<TemplatesCache>(CHECKLIST_TEMPLATES_KEY, {
          ...previous,
          data: previous.data.map((template) =>
            template.id === templateId
              ? { ...template, items: applyOrder(template.items, itemIds) }
              : template,
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CHECKLIST_TEMPLATES_KEY, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CHECKLIST_TEMPLATES_KEY }),
  });
}
