"use client";

import { useAuthenticatedQuery } from "./use-authenticated-query";
import { keysToCamel } from "@/lib/case-utils";
import type { PropertyChecklistItem } from "@/lib/schemas/property-checklist";

// Per-property query key - the property-checklist-api mutations invalidate the
// matching property's key so the Listings checklist editor refreshes.
export function propertyChecklistKey(propertyId: string) {
  return ["properties", propertyId, "checklist"];
}

// GET /properties/{id}/checklist returns the { data: [...] } list envelope
// (a flat, unpaginated item list); components read `.data`.
interface ListEnvelope<T> {
  data: T[];
}

export function useDefaultChecklist(propertyId: string, options?: { enabled?: boolean }) {
  return useAuthenticatedQuery<ListEnvelope<PropertyChecklistItem>>(
    propertyChecklistKey(propertyId),
    `/properties/${propertyId}/checklist`,
    {
      select: (raw) => keysToCamel<ListEnvelope<PropertyChecklistItem>>(raw),
      enabled: (options?.enabled ?? true) && !!propertyId,
    },
  );
}
