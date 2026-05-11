"use client";

import { useEffect, useRef, useState } from "react";

import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import { useBooking, useDismissConflict, useUpdateBookingNotes } from "@/hooks/use-bookings";
import { useListings } from "@/hooks/use-listings";
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
  const { data: listingsData } = useListings();
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
  const listingName = displayBooking
    ? ((listingsData?.data ?? []).find((l) => l.id === displayBooking.listingId)?.name ??
      displayBooking.listingId.slice(0, 8))
    : "";

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
      {open && isLoading && <p className="text-body text-highlight-10">Loading booking…</p>}
      {open && !isLoading && !booking && (
        <p className="text-body text-highlight-10">Booking not found.</p>
      )}
      {displayBooking && (
        <div className="space-y-md">
          {isConflicted && (
            <div className="p-sm border-neutral-30 bg-neutral-30 dark:border-status-danger dark:bg-status-danger rounded-lg border">
              <p className="text-body text-status-danger dark:text-neutral-30 font-medium">
                Date conflict detected
              </p>
              <p className="text-body mt-xs text-status-danger">
                This booking overlaps with another booking on a different listing for the same
                property. Resolve the conflict on the booking platform, then dismiss it here.
              </p>
              <button
                type="button"
                onClick={handleDismissConflict}
                disabled={dismissConflict.isPending}
                className="mt-base px-sm py-base text-body text-status-danger rounded-lg border font-medium disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--status-danger)",
                  backgroundColor: "var(--surface-60)",
                }}
              >
                {dismissConflict.isPending ? "Dismissing…" : "Dismiss conflict"}
              </button>
            </div>
          )}

          <div>
            <p className="text-body text-highlight-10">Listing</p>
            <p className="text-body text-highlight-10 font-medium">{listingName}</p>
          </div>

          <div className="gap-sm grid grid-cols-2">
            <div>
              <p className="text-body text-highlight-10">Check-in</p>
              <p className="text-body text-highlight-10 font-medium">
                {formatInPropertyTimezone(displayBooking.checkIn, tz)}
              </p>
            </div>
            <div>
              <p className="text-body text-highlight-10">Check-out</p>
              <p className="text-body text-highlight-10 font-medium">
                {formatInPropertyTimezone(displayBooking.checkOut, tz)}
              </p>
            </div>
          </div>

          <div className="gap-sm grid grid-cols-2">
            <div>
              <p className="text-body text-highlight-10">Platform</p>
              <p className="text-body text-highlight-10">{displayBooking.source}</p>
            </div>
            <div>
              <p className="text-body text-highlight-10">Status</p>
              <p className="text-body text-highlight-10 capitalize">{displayBooking.status}</p>
            </div>
          </div>

          {(displayBooking.guestName || displayBooking.guestEmail) && (
            <div>
              <p className="text-body text-highlight-10">Guest</p>
              <p className="text-body text-highlight-10">
                {displayBooking.guestName ?? "-"}
                {displayBooking.guestEmail && (
                  <span className="ml-xs text-highlight-10">({displayBooking.guestEmail})</span>
                )}
              </p>
            </div>
          )}

          {displayBooking.externalBookingId && (
            <div>
              <p className="text-body text-highlight-10">External ID</p>
              <p className="font-data text-body text-highlight-10">
                {displayBooking.externalBookingId}
              </p>
            </div>
          )}

          {displayBooking.rawSummary && (
            <div>
              <p className="text-body text-highlight-10">iCal summary</p>
              <p className="text-body text-highlight-10">{displayBooking.rawSummary}</p>
            </div>
          )}

          <div className="space-y-xs">
            <label htmlFor="booking-notes" className="text-body text-highlight-10 font-semibold">
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
                className="px-sm py-base text-body text-surface-60 rounded-lg font-medium disabled:opacity-60"
                style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
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
