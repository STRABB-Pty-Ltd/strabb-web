export interface SyncLogMetrics {
  bookingsCreated: number;
  bookingsUpdated: number;
  bookingsUnchanged: number;
}

export interface SyncLogResponse {
  id: string;
  listingId: string;
  startedAt: string;
  completedAt: string | null;
  // Status enum aligned with strabb-api PR #3 (shared primitives):
  // synced | failed | in_progress | skipped. The legacy values
  // (success/error/running) are no longer emitted.
  status: string;
  metrics: SyncLogMetrics;
  errorMessage: string | null;
  createdAt: string;
}
