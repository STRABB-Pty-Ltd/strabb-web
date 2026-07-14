"use client";

import { CalendarPlus, CalendarOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAppStore } from "@/stores/app-store";

/** Calendar-page-only creation actions, owner/admin UX only. */
export function CalendarActionsSection() {
  const openBookingFormOverlay = useAppStore((s) => s.openBookingFormOverlay);
  const openAvailabilityBlockDrawer = useAppStore((s) => s.openAvailabilityBlockDrawer);
  const { role } = useCurrentUser();
  const canCreate = role === "owner" || role === "admin";

  /* Overrides that keep the pre-primitive sidebar row geometry: natural
     height (py-base, not the fixed h-lg), left-aligned content, borderless
     fill, and the original colour-only transition. */
  const buttonClass = "h-auto justify-start gap-base border-0 px-sm py-base transition-colors";

  // Cleaners neither create bookings nor block dates; hide the whole
  // section rather than showing a button that 403s on save. A null role
  // (session loading) hides too - no owner-control flash. API stays the
  // real gate.
  if (!canCreate) {
    return null;
  }

  return (
    <div className="p-sm">
      <h3
        className="mb-base text-body font-semibold tracking-wide uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        Create
      </h3>
      <div className="gap-xs flex flex-col">
        <Button
          type="button"
          variant="secondary"
          onClick={() => openBookingFormOverlay()}
          className={buttonClass}
        >
          <CalendarPlus size={13} aria-hidden="true" />
          Add booking
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => openAvailabilityBlockDrawer()}
          className={buttonClass}
        >
          <CalendarOff size={13} aria-hidden="true" />
          Block dates
        </Button>
      </div>
    </div>
  );
}
