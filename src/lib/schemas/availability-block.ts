/**
 * Availability-block API contract (strabb-api /availability-blocks).
 * Spans are half-open [startDate, endDate): a block 2026-08-10 to 2026-08-13
 * blocks the nights of the 10th, 11th and 12th. The API accepts date-only
 * strings (YYYY-MM-DD) and returns UTC datetimes.
 */

export interface AvailabilityBlockResponse {
  id: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvailabilityBlockRequest {
  propertyId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  notes?: string | null;
}

export interface UpdateAvailabilityBlockRequest {
  startDate?: string;
  endDate?: string;
  reason?: string;
  notes?: string | null;
}

export interface AvailabilityBlockFilters {
  propertyId?: string;
  from?: string;
  to?: string;
}

export const BLOCK_REASON_OPTIONS = [
  { value: "owner_block", label: "Owner stay" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
] as const;

export function blockReasonLabel(reason: string): string {
  return BLOCK_REASON_OPTIONS.find((o) => o.value === reason)?.label ?? "Blocked";
}
