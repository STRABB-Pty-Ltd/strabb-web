"use client";

import { BookingFormDrawer } from "@/components/overlays/booking-form-drawer";
import { useAppStore } from "@/stores/app-store";

/** Store-driven mount of the booking create drawer for page-level entry
 *  points (calendar sidebar action, bookings view). Opened without a
 *  listingId the drawer shows its listing-picker step. Edit mode stays
 *  local to booking-detail-drawer. */
export function BookingFormOverlay() {
  const state = useAppStore((s) => s.bookingFormOverlay);
  const close = useAppStore((s) => s.closeBookingFormOverlay);

  return (
    <BookingFormDrawer
      open={state?.open ?? false}
      onClose={close}
      mode={state ? { kind: "create", listingId: state.listingId ?? undefined } : null}
    />
  );
}
