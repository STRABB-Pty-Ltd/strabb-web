"use client";

import { CalendarPlus, CalendarOff } from "lucide-react";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useAppStore } from "@/stores/app-store";

/** Calendar-page-only creation actions. "Block dates" is owner/admin UX:
 *  a null role (session loading) hides it rather than flashing it at a
 *  cleaner - the API remains the real gate. */
export function CalendarActionsSection() {
  const openBookingFormOverlay = useAppStore((s) => s.openBookingFormOverlay);
  const openAvailabilityBlockDrawer = useAppStore((s) => s.openAvailabilityBlockDrawer);
  const { role } = useCurrentUser();
  const canBlock = role === "owner" || role === "admin";

  const buttonClass =
    "gap-base px-sm py-base text-body flex items-center rounded-lg font-medium transition-colors";
  const buttonStyle = {
    backgroundColor: "var(--neutral-30)",
    color: "var(--highlight-10)",
  };

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
        {canBlock && (
          <button
            type="button"
            onClick={() => openAvailabilityBlockDrawer()}
            className={buttonClass}
            style={buttonStyle}
          >
            <CalendarOff size={13} aria-hidden="true" />
            Block dates
          </button>
        )}
      </div>
    </div>
  );
}
