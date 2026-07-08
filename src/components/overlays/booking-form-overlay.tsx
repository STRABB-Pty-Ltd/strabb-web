"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { BookingFormDrawer } from "@/components/overlays/booking-form-drawer";
import { useAppStore } from "@/stores/app-store";

/** Store-driven mount of the booking create drawer for page-level entry
 *  points (calendar sidebar action, bookings view). Opened without a
 *  listingId the drawer shows its listing-picker step. Edit mode stays
 *  local to booking-detail-drawer. */
export function BookingFormOverlay() {
  const state = useAppStore((s) => s.bookingFormOverlay);
  const close = useAppStore((s) => s.closeBookingFormOverlay);

  const isOpen = state?.open ?? false;
  const listingId = state?.listingId ?? undefined;

  // Stable mode identity: the drawer resets its form when `mode` changes,
  // so a fresh object per shell render would wipe typed input.
  const mode = useMemo(
    () => (isOpen ? ({ kind: "create", listingId } as const) : null),
    [isOpen, listingId],
  );

  // Close on route change rather than following the user across pages.
  const pathname = usePathname();
  const lastPathname = useRef(pathname);
  useEffect(() => {
    if (pathname !== lastPathname.current) {
      lastPathname.current = pathname;
      if (isOpen) close();
    }
  }, [pathname, isOpen, close]);

  return <BookingFormDrawer open={isOpen} onClose={close} mode={mode} />;
}
