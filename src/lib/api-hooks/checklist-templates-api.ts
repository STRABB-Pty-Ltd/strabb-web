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
    mutationFn: ({ templateId, label }: { templateId: string; label: string }) =>
      apiClient.post<DataEnvelope<ChecklistItem>>(`/checklist-templates/${templateId}/items`, {
        label,
      }),
    meta: { suppressGlobalError: true },
    onSuccess: invalidate,
  });
}

export function useUpdateItem() {
  const apiClient = useApiClient();
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: ({
      templateId,
      itemId,
      label,
    }: {
      templateId: string;
      itemId: string;
      label: string;
    }) =>
      apiClient.put<DataEnvelope<ChecklistItem>>(
        `/checklist-templates/${templateId}/items/${itemId}`,
        { label },
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

// The client keysToSnake-converts itemIds -> item_ids, which is what the api's
// ChecklistReorderRequest expects (the full item set in the desired order).
export function useReorderItems() {
  const apiClient = useApiClient();
  const invalidate = useInvalidateTemplates();

  return useMutation({
    mutationFn: ({ templateId, itemIds }: { templateId: string; itemIds: string[] }) =>
      apiClient.put<DataEnvelope<ChecklistTemplate>>(`/checklist-templates/${templateId}/reorder`, {
        itemIds,
      }),
    meta: { suppressGlobalError: true },
    onSuccess: invalidate,
  });
}
