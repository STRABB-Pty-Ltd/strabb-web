"use client";

import { CalendarPlus, CalendarOff } from "lucide-react";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useAppStore } from "@/stores/app-store";

/** Calendar-page-only creation actions, owner/admin UX only. */
export function CalendarActionsSection() {
  const openBookingFormOverlay = useAppStore((s) => s.openBookingFormOverlay);
  const openAvailabilityBlockDrawer = useAppStore((s) => s.openAvailabilityBlockDrawer);
  const { role } = useCurrentUser();
  const canCreate = role === "owner" || role === "admin";

  const buttonClass =
    "gap-base px-sm py-base text-body flex items-center rounded-lg font-medium transition-colors";
  const buttonStyle = {
    backgroundColor: "var(--neutral-30)",
    color: "var(--highlight-10)",
  };

  // Cleaners neither create bookings nor block dates; hide the whole
  // section rather than showing a button that 403s on save. A null role
  // (session loading) hides too - no owner-control flash. API stays the
  // real gate.
  if (!canCreate) {
    return null;
  }

  return (
    <div style={{ padding: "var(--space-sm)" }}>
      <h3
        className="mb-base text-body font-semibold tracking-wide uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        Create
      </h3>
      <div className="gap-xs flex flex-col">
        <button
          type="button"
          onClick={() => openBookingFormOverlay()}
          className={buttonClass}
          style={buttonStyle}
        >
          <CalendarPlus size={13} aria-hidden="true" />
          Add booking
        </button>
        <button
          type="button"
          onClick={() => openAvailabilityBlockDrawer()}
          className={buttonClass}
          style={buttonStyle}
        >
          <CalendarOff size={13} aria-hidden="true" />
          Block dates
        </button>
      </div>
    </div>
  );
}
