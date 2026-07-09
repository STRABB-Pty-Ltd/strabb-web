export type BookingChannel =
  | "airbnb"
  | "booking_com"
  | "vrbo"
  | "direct"
  | "ota"
  | "email"
  | "internal_notes";

export type BookingStatus = "checked_out" | "checked_in" | "confirmed" | "pending" | "cancelled";

export interface Booking {
  id: string;
  listingId: string;
  listingName: string;
  guestName: string;
  guestEmail: string | null;
  channel: BookingChannel;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  nightlyRate: number;
  totalAmount: number;
  currency?: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
}
