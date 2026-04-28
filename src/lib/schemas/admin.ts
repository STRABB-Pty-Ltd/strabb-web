export interface SyncLogResponse {
  id: string;
  listingId: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  bookingsCreated: number;
  bookingsUpdated: number;
  bookingsUnchanged: number;
  errorMessage: string | null;
  createdAt: string;
}
