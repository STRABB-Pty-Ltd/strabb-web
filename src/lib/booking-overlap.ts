import type { BookingResponse } from "@/lib/schemas/booking";

/** Statuses whose spans no longer occupy nights - mirrors the gantt view's
 *  inactive-booking rule. */
const INACTIVE_BOOKING_STATUSES = new Set(["cancelled", "checked_out"]);

/**
 * First active booking whose stay [checkIn, checkOut) overlaps the proposed
 * span, or null. Pure and client-cache-based: an advisory pre-submit warning
 * only - server-side conflict detection stays the source of truth (bookings
 * outside the fetched page can be missed).
 */
export function findOverlappingBooking(
  bookings: BookingResponse[],
  checkInIso: string,
  checkOutIso: string,
  excludeBookingId?: string,
): BookingResponse | null {
  const start = Date.parse(checkInIso);
  const end = Date.parse(checkOutIso);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;

  for (const booking of bookings) {
    if (booking.id === excludeBookingId) continue;
    if (INACTIVE_BOOKING_STATUSES.has(booking.status)) continue;
    const existingStart = Date.parse(booking.checkIn);
    const existingEnd = Date.parse(booking.checkOut);
    if (Number.isNaN(existingStart) || Number.isNaN(existingEnd)) continue;
    // Half-open spans overlap iff each starts before the other ends.
    if (existingStart < end && existingEnd > start) return booking;
  }
  return null;
}
