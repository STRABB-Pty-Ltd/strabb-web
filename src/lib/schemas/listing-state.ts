/**
 * Wire types for the per-(listing, date) ARI state surface (F.4 PATCH
 * endpoints + F.7a GET). Mirrors `app/schemas/listing_ari.py` on the
 * backend.
 */

export interface DailyListingStateResponse {
  date: string; // ISO date "YYYY-MM-DD"
  rate: number | null; // nightly rate in dollars; null = use listing.nightlyRate
  minStay: number | null;
  maxStay: number | null;
  closedToArrival: boolean;
  closedToDeparture: boolean;
  stopSell: boolean;
  availabilityCount: number;
}

export interface DailyListingStateListResponse {
  data: DailyListingStateResponse[];
}

/** Body for PATCH /listings/{id}/rates — single date or inclusive range. */
export type RateUpdateRequest =
  | { date: string; rate: number }
  | { dateFrom: string; dateTo: string; rate: number };

/** Body for PATCH /listings/{id}/restrictions — F.8 placeholder. */
export interface RestrictionsUpdateRequest {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  minStay?: number;
  maxStay?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
  stopSell?: boolean;
}

/** Body for PATCH /listings/{id}/availability — F.9 placeholder. */
export type AvailabilityUpdateRequest =
  | { date: string; count: number }
  | { dateFrom: string; dateTo: string; count: number };
