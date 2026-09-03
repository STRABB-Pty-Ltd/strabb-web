"use client";

import { useAuthenticatedQuery } from "./use-authenticated-query";
import { keysToCamel } from "@/lib/case-utils";
import type { ChecklistTemplate } from "@/lib/schemas/checklist-template";

// Shared query key - the checklist-templates-api mutations invalidate this on
// success so the Settings > Cleaning list refreshes.
export const CHECKLIST_TEMPLATES_KEY = ["checklist-templates"];

// GET /checklist-templates returns the standard paginated envelope
// ({ data: [...], meta }); components read `.data`. The editor is not paginated
// (a host has a handful of templates), so we request the full first page.
interface PaginatedEnvelope<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function useChecklistTemplates(options?: { enabled?: boolean }) {
  return useAuthenticatedQuery<PaginatedEnvelope<ChecklistTemplate>>(
    CHECKLIST_TEMPLATES_KEY,
    "/checklist-templates?page_size=100",
    {
      select: (raw) => keysToCamel<PaginatedEnvelope<ChecklistTemplate>>(raw),
      enabled: options?.enabled,
    },
  );
}
