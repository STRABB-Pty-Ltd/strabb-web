"use client";

import { useEffect, useRef, useState } from "react";

import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import { useBooking, useDismissConflict, useUpdateBookingNotes } from "@/hooks/use-bookings";
import { useTimezoneForListing } from "@/hooks/use-property-timezone";
import { ApiError } from "@/lib/api-client";
import { formatInPropertyTimezone } from "@/lib/date-utils";
import { useAppStore } from "@/stores/app-store";

const statusColors: Record<string, string> = {
  confirmed: "var(--status-confirmed)",
  pending: "var(--status-pending)",
  cancelled: "var(--status-cancelled)",
};

function toastError(addToast: ReturnType<typeof useAppStore.getState>["addToast"]) {
  return (err: unknown) => {
    const message =
      err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Something went wrong";
    addToast({ type: "error", message });
  };
}

export function BookingDetailDrawer() {
  const drillDownPanel = useAppStore((s) => s.drillDownPanel);
  const closeDrillDownPanel = useAppStore((s) => s.closeDrillDownPanel);
  const addToast = useAppStore((s) => s.addToast);

  const open = !!drillDownPanel?.open && drillDownPanel.type === "booking";
  const itemId = open ? drillDownPanel.itemId : null;

  const { data: booking, isLoading } = useBooking(itemId);
  const tz = useTimezoneForListing(booking?.listingId);
  const updateNotes = useUpdateBookingNotes();
  const dismissConflict = useDismissConflict();

  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (booking) setNotes(booking.notes ?? "");
  }, [booking?.id, booking]);

  const showError = toastError(addToast);
  // Cache the last-seen booking so accent bar + body content stay populated
  // through the 300ms close animation. Only fall back during close.
  const lastBookingRef = useRef<typeof booking | null>(null);
  if (booking) lastBookingRef.current = booking;
  const displayBooking = open ? booking : lastBookingRef.current;
  const isConflicted = displayBooking?.conflictStatus === "conflicted";
  const status = displayBooking?.status ?? "pending";

  const handleSaveNotes = () => {
    if (!booking) return;
    updateNotes.mutate(
      { id: booking.id, notes: notes || null },
      {
        onSuccess: () => addToast({ type: "success", message: "Notes saved" }),
        onError: showError,
      },
    );
  };

  const handleDismissConflict = () => {
    if (!booking) return;
    dismissConflict.mutate(booking.id, {
      onSuccess: () => {
        addToast({ type: "success", message: "Conflict dismissed" });
        closeDrillDownPanel();
      },
      onError: showError,
    });
  };

  return (
    <DrillDownPanel
      open={open}
      onClose={closeDrillDownPanel}
      title="Booking"
      accentColor={statusColors[status] ?? "var(--strabb-secondary)"}
    >
      {open && isLoading && <p className="text-body text-gray-400">Loading booking…</p>}
      {open && !isLoading && !booking && (
        <p className="text-body text-gray-500">Booking not found.</p>
      )}
      {displayBooking && (
        <div className="space-y-md">
          {isConflicted && (
            <div className="p-sm rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
              <p className="text-body font-medium text-red-800 dark:text-red-200">
                Date conflict detected
              </p>
              <p className="text-body mt-xs text-red-700 dark:text-red-300">
                This booking overlaps with another booking on a different listing for the same
                property. Resolve the conflict on the booking platform, then dismiss it here.
              </p>
              <button
                type="button"
                onClick={handleDismissConflict}
                disabled={dismissConflict.isPending}
                className="mt-base px-sm py-base text-body rounded-lg border font-medium text-red-800 disabled:opacity-60"
                style={{ borderColor: "rgb(252 165 165)", backgroundColor: "white" }}
              >
                {dismissConflict.isPending ? "Dismissing…" : "Dismiss conflict"}
              </button>
            </div>
          )}

          <div className="gap-sm grid grid-cols-2">
            <div>
              <p className="text-body text-gray-500">Check-in</p>
              <p className="text-body font-medium text-gray-800">
                {formatInPropertyTimezone(displayBooking.checkIn, tz)}
              </p>
            </div>
            <div>
              <p className="text-body text-gray-500">Check-out</p>
              <p className="text-body font-medium text-gray-800">
                {formatInPropertyTimezone(displayBooking.checkOut, tz)}
              </p>
            </div>
          </div>

          <div className="gap-sm grid grid-cols-2">
            <div>
              <p className="text-body text-gray-500">Platform</p>
              <p className="text-body text-gray-800">{displayBooking.source}</p>
            </div>
            <div>
              <p className="text-body text-gray-500">Status</p>
              <p className="text-body text-gray-800 capitalize">{displayBooking.status}</p>
            </div>
          </div>

          {(displayBooking.guestName || displayBooking.guestEmail) && (
            <div>
              <p className="text-body text-gray-500">Guest</p>
              <p className="text-body text-gray-800">
                {displayBooking.guestName ?? "-"}
                {displayBooking.guestEmail && (
                  <span className="ml-xs text-gray-500">({displayBooking.guestEmail})</span>
                )}
              </p>
            </div>
          )}

          {displayBooking.externalBookingId && (
            <div>
              <p className="text-body text-gray-500">External ID</p>
              <p className="font-data text-body text-gray-700">
                {displayBooking.externalBookingId}
              </p>
            </div>
          )}

          {displayBooking.rawSummary && (
            <div>
              <p className="text-body text-gray-500">iCal summary</p>
              <p className="text-body text-gray-700">{displayBooking.rawSummary}</p>
            </div>
          )}

          <div className="space-y-xs">
            <label htmlFor="booking-notes" className="text-body font-semibold text-gray-700">
              Notes
            </label>
            <textarea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this booking…"
              rows={3}
              className="px-sm py-base text-body w-full rounded-lg border"
              style={{ borderColor: "var(--border)" }}
            />
            <div>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={updateNotes.isPending || notes === (displayBooking.notes ?? "")}
                className="px-sm py-base text-body rounded-lg font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "var(--strabb-secondary)" }}
              >
                {updateNotes.isPending ? "Saving…" : "Save notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DrillDownPanel>
  );
}
