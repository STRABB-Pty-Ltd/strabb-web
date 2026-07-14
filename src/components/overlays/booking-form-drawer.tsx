"use client";

import { useEffect, useMemo, useState } from "react";

import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useBookings,
  useCreateBooking,
  useUpdateBooking,
  type CreateBookingRequest,
  type UpdateBookingRequest,
} from "@/hooks/use-bookings";
import { useListings } from "@/hooks/use-listings";
import { ApiError } from "@/lib/api-client";
import { findOverlappingBooking } from "@/lib/booking-overlap";
import type { BookingResponse } from "@/lib/schemas/booking";
import { useAppStore } from "@/stores/app-store";

/** Create mode without a listingId shows a listing-picker step first
 *  (page-level entry points open the drawer before a listing is known). */
type Mode = { kind: "create"; listingId?: string } | { kind: "edit"; booking: BookingResponse };

interface BookingFormDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: Mode | null;
}

interface FormState {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: string;
  totalAmount: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  listingId: "",
  checkIn: "",
  checkOut: "",
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  guestCount: "",
  totalAmount: "",
  notes: "",
};

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  // Trim seconds for the browser's datetime-local input (yyyy-MM-ddTHH:mm).
  return iso.slice(0, 16);
}

function fromDatetimeLocal(value: string): string {
  // Browser supplies yyyy-MM-ddTHH:mm without timezone; the backend
  // parses naive ISO as UTC, so attach :00Z so what the host sees in
  // the form matches what we send (no implicit timezone surprise).
  if (!value) return "";
  return `${value}:00Z`;
}

function bookingToFormState(b: BookingResponse): FormState {
  return {
    listingId: b.listingId,
    checkIn: toDatetimeLocal(b.checkIn),
    checkOut: toDatetimeLocal(b.checkOut),
    guestName: b.guestName ?? "",
    guestEmail: b.guestEmail ?? "",
    guestPhone: b.guestPhone ?? "",
    guestCount: b.guestCount != null ? String(b.guestCount) : "",
    totalAmount: b.totalAmount != null ? String(b.totalAmount) : "",
    notes: b.notes ?? "",
  };
}

export function BookingFormDrawer({ open, onClose, mode }: BookingFormDrawerProps) {
  const { data: listingsData } = useListings();
  const create = useCreateBooking();
  const update = useUpdateBooking();
  const addToast = useAppStore((s) => s.addToast);
  const openDrillDownPanel = useAppStore((s) => s.openDrillDownPanel);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode?.kind === "edit") {
      setForm(bookingToFormState(mode.booking));
    } else {
      setForm({ ...EMPTY_FORM, listingId: mode?.listingId ?? "" });
    }
    setError(null);
    setConfirmingCancel(false);
  }, [open, mode]);

  const listings = listingsData?.data ?? [];
  const needsListingPicker = mode?.kind === "create" && !mode.listingId;
  const targetListingId = mode?.kind === "edit" ? mode.booking.listingId : form.listingId;
  const listingName = listings.find((l) => l.id === targetListingId)?.name ?? "";
  const title =
    mode?.kind === "edit"
      ? `Edit booking${listingName ? ` - ${listingName}` : ""}`
      : `Add booking${listingName ? ` - ${listingName}` : ""}`;
  const isCancelled = mode?.kind === "edit" && mode.booking.status === "cancelled";
  const saving = create.isPending || update.isPending;

  // Advisory overlap warning: one page of this listing's bookings from the
  // shared cache. Never blocks submission - server-side conflict detection
  // stays the source of truth.
  const listingBookings = useBookings({ listingId: targetListingId || undefined }, 1, 100, {
    enabled: open && !!targetListingId,
  });
  const overlappingBooking = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return null;
    return findOverlappingBooking(
      listingBookings.data?.data ?? [],
      fromDatetimeLocal(form.checkIn),
      fromDatetimeLocal(form.checkOut),
      mode?.kind === "edit" ? mode.booking.id : undefined,
    );
  }, [listingBookings.data, form.checkIn, form.checkOut, mode]);

  const update_ = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleError = (err: unknown) => {
    const message =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Save failed";
    setError(message);
    addToast({ type: "error", message });
  };

  const handleSave = async () => {
    setError(null);
    if (mode?.kind === "create" && !targetListingId) {
      setError("Choose a listing");
      return;
    }
    if (!form.checkIn || !form.checkOut) {
      setError("Check-in and check-out dates are required");
      return;
    }
    if (form.checkOut <= form.checkIn) {
      setError("Check-out must be after check-in");
      return;
    }
    const parseNumber = (s: string): number | null => {
      const t = s.trim();
      if (!t) return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    };
    const guestCount = parseNumber(form.guestCount);
    const totalAmount = parseNumber(form.totalAmount);
    if (form.guestCount.trim() && guestCount === null) {
      setError("Guest count must be a number");
      return;
    }
    if (form.totalAmount.trim() && totalAmount === null) {
      setError("Total amount must be a number");
      return;
    }

    if (mode?.kind === "create") {
      const payload: CreateBookingRequest = {
        listingId: targetListingId,
        checkIn: fromDatetimeLocal(form.checkIn),
        checkOut: fromDatetimeLocal(form.checkOut),
        guestName: form.guestName.trim() || null,
        guestEmail: form.guestEmail.trim() || null,
        guestPhone: form.guestPhone.trim() || null,
        guestCount,
        totalAmount,
        notes: form.notes.trim() || null,
      };
      try {
        const created = await create.mutateAsync(payload);
        addToast({
          type: "success",
          message: "Booking created",
          action: created?.id
            ? { label: "View booking", onClick: () => openDrillDownPanel("booking", created.id) }
            : undefined,
        });
        onClose();
      } catch (err) {
        handleError(err);
      }
    } else if (mode?.kind === "edit") {
      const payload: UpdateBookingRequest = {
        checkIn: fromDatetimeLocal(form.checkIn),
        checkOut: fromDatetimeLocal(form.checkOut),
        guestName: form.guestName.trim() || null,
        guestEmail: form.guestEmail.trim() || null,
        guestPhone: form.guestPhone.trim() || null,
        guestCount,
        totalAmount,
        notes: form.notes.trim() || null,
      };
      try {
        await update.mutateAsync({ id: mode.booking.id, ...payload });
        addToast({ type: "success", message: "Booking updated" });
        onClose();
      } catch (err) {
        handleError(err);
      }
    }
  };

  const handleCancelConfirmed = async () => {
    if (mode?.kind !== "edit") return;
    try {
      await update.mutateAsync({ id: mode.booking.id, status: "cancelled" });
      addToast({ type: "success", message: "Booking cancelled" });
      onClose();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <DrillDownPanel open={open} onClose={onClose} title={title}>
      <div className="space-y-sm">
        {needsListingPicker && (
          <div>
            <label htmlFor="bk-listing" className="text-body text-highlight-10 block font-medium">
              Listing
            </label>
            <Select
              id="bk-listing"
              value={form.listingId}
              onChange={(e) => update_({ listingId: e.target.value })}
              placeholder="Choose a listing"
              options={listings.map((l) => ({ value: l.id, label: l.name }))}
            />
          </div>
        )}
        <Field
          id="bk-checkin"
          label="Check-in"
          type="datetime-local"
          value={form.checkIn}
          onChange={(v) => update_({ checkIn: v })}
        />
        <Field
          id="bk-checkout"
          label="Check-out"
          type="datetime-local"
          value={form.checkOut}
          onChange={(v) => update_({ checkOut: v })}
        />
        {overlappingBooking && (
          <p
            className="text-body px-sm py-base rounded-lg"
            role="status"
            style={{
              backgroundColor: "var(--status-warning-tint)",
              color: "var(--status-warning)",
            }}
          >
            Heads up: these dates overlap {overlappingBooking.guestName ?? "another booking"} (
            {overlappingBooking.checkIn.slice(0, 10)} to {overlappingBooking.checkOut.slice(0, 10)}
            ). You can still save; the conflict will be flagged.
          </p>
        )}
        <Field
          id="bk-guest-name"
          label="Guest name"
          value={form.guestName}
          onChange={(v) => update_({ guestName: v })}
        />
        <Field
          id="bk-guest-email"
          label="Guest email"
          type="email"
          value={form.guestEmail}
          onChange={(v) => update_({ guestEmail: v })}
        />
        <Field
          id="bk-guest-phone"
          label="Guest phone"
          value={form.guestPhone}
          onChange={(v) => update_({ guestPhone: v })}
        />
        <Field
          id="bk-guest-count"
          label="Guest count"
          type="number"
          value={form.guestCount}
          onChange={(v) => update_({ guestCount: v })}
        />
        <Field
          id="bk-total"
          label="Total amount (AUD)"
          type="number"
          value={form.totalAmount}
          onChange={(v) => update_({ totalAmount: v })}
        />
        <div>
          <label htmlFor="bk-notes" className="text-body text-highlight-10 block font-medium">
            Notes
          </label>
          <Textarea
            id="bk-notes"
            value={form.notes}
            onChange={(e) => update_({ notes: e.target.value })}
            rows={3}
          />
        </div>

        {error && (
          <p className="text-body text-status-danger" role="alert">
            {error}
          </p>
        )}

        <div className="gap-sm pt-sm flex items-center justify-end">
          {mode?.kind === "edit" && !isCancelled && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmingCancel(true)}
              disabled={saving}
            >
              Cancel booking
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : mode?.kind === "edit" ? "Save changes" : "Create booking"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title="Cancel this booking?"
        description="Channex availability will be restored for the booked dates."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        destructive
        onConfirm={handleCancelConfirmed}
      />
    </DrillDownPanel>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "number" | "datetime-local";
}

function Field({ id, label, value, onChange, type = "text" }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-body text-highlight-10 block font-medium">
        {label}
      </label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
