"use client";

import { useEffect, useRef, useState } from "react";

import { BookingFormDrawer } from "@/components/overlays/booking-form-drawer";
import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useBooking, useDismissConflict, useUpdateBookingNotes } from "@/hooks/use-bookings";
import { useListings } from "@/hooks/use-listings";
import { useTimezoneForListing } from "@/hooks/use-property-timezone";
import { ApiError, isForbidden } from "@/lib/api-client";
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

  const { data: booking, isLoading, error } = useBooking(itemId);
  // Bookings carry money fields (nightly rate, OTA commission), so the API gates
  // them to owner/admin. A cleaner can still open this drawer from a calendar
  // booking bar; when the endpoint 403s, degrade quietly to a permission notice
  // rather than the misleading "Booking not found" or an error toast (B.4).
  const forbidden = isForbidden(error);
  const tz = useTimezoneForListing(booking?.listingId);
  const { data: listingsData } = useListings();
  const updateNotes = useUpdateBookingNotes();
  const dismissConflict = useDismissConflict();

  const [notes, setNotes] = useState("");
  // Edit / cancel are scoped to manual bookings (source=direct). Editing
  // a Channex-sourced booking from STRABB would drift from Channex's
  // view and get reverted on the next pull, so we hide the affordances
  // there. The form drawer is mounted alongside this detail panel and
  // refreshes its own state from the booking record each time it opens.
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);

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
      accentColor={statusColors[status] ?? "var(--highlight-10)"}
    >
      {open && isLoading && <p className="text-body text-highlight-10">Loading booking…</p>}
      {open && !isLoading && !booking && forbidden && (
        <p className="text-body text-highlight-10">You do not have access to booking details.</p>
      )}
      {open && !isLoading && !booking && !forbidden && (
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
              <Button
                type="button"
                variant="destructive"
                onClick={handleDismissConflict}
                disabled={dismissConflict.isPending}
                className="mt-base"
              >
                {dismissConflict.isPending ? "Dismissing…" : "Dismiss conflict"}
              </Button>
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
            <Textarea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this booking…"
              rows={3}
            />
            <div>
              <Button
                type="button"
                onClick={handleSaveNotes}
                disabled={updateNotes.isPending || notes === (displayBooking.notes ?? "")}
              >
                {updateNotes.isPending ? "Saving…" : "Save notes"}
              </Button>
            </div>
          </div>

          {displayBooking.source === "direct" && displayBooking.status !== "cancelled" && (
            <div className="pt-sm border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-body text-highlight-10 mb-xs font-semibold">Manage booking</p>
              <p className="text-body mb-xs" style={{ color: "var(--text-secondary)" }}>
                Edit dates / guest fields or cancel this booking. Channex availability updates
                automatically.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingBookingId(displayBooking.id)}
              >
                Edit booking details
              </Button>
            </div>
          )}
        </div>
      )}
      <BookingFormDrawer
        open={editingBookingId !== null}
        onClose={() => setEditingBookingId(null)}
        mode={editingBookingId && booking ? { kind: "edit", booking } : null}
      />
    </DrillDownPanel>
  );
}
