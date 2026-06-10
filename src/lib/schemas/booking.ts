export interface BookingResponse {
  id: string;
  listingId: string;
  propertyId: string;
  guestId: string | null;
  externalBookingId: string | null;
  idempotencyKey: string;
  checkIn: string;
  checkOut: string;
  status: string;
  conflictStatus: string | null;
  source: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  guestCount: number | null;
  totalAmount: number | null;
  nightlyRate: number | null;
  currency?: string;
  specialRequests: string | null;
  otaCommission: number | null;
  rawSummary: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingListResponse {
  data: BookingResponse[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface BookingSummaryResponse {
  totalBookings: number;
  activeConflicts: number;
}

export interface BookingFilters {
  propertyId?: string;
  listingId?: string;
  platform?: string;
  status?: string;
  conflictStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const BOOKING_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "pending", label: "Pending" },
] as const;

export const CONFLICT_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "conflicted", label: "Conflicted" },
  { value: "clear", label: "Clear" },
] as const;
