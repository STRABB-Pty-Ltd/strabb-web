"use client";

import { useEffect, useState } from "react";

import { DrillDownPanel } from "@/components/overlays/drill-down-panel";
import {
  useCreateBooking,
  useUpdateBooking,
  type CreateBookingRequest,
  type UpdateBookingRequest,
} from "@/hooks/use-bookings";
import { useListings } from "@/hooks/use-listings";
import { ApiError } from "@/lib/api-client";
import type { BookingResponse } from "@/lib/schemas/booking";
import { useAppStore } from "@/stores/app-store";

type Mode = { kind: "create"; listingId: string } | { kind: "edit"; booking: BookingResponse };

interface BookingFormDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: Mode | null;
}

interface FormState {
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

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode?.kind === "edit") {
      setForm(bookingToFormState(mode.booking));
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [open, mode]);

  const listings = listingsData?.data ?? [];
  const targetListingId = mode?.kind === "edit" ? mode.booking.listingId : mode?.listingId;
  const listingName =
    listings.find((l) => l.id === targetListingId)?.name ?? targetListingId?.slice(0, 8) ?? "";
  const title =
    mode?.kind === "edit" ? `Edit booking — ${listingName}` : `Add booking — ${listingName}`;
  const isCancelled = mode?.kind === "edit" && mode.booking.status === "cancelled";
  const saving = create.isPending || update.isPending;

  const update_ = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleError = (err: unknown) => {
    const message =
      err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Save failed";
    setError(message);
    addToast({ type: "error", message });
  };

  const handleSave = async () => {
    setError(null);
    if (!form.checkIn || !form.checkOut) {
      setError("Check-in and check-out dates are required");
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
        listingId: mode.listingId,
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
        await create.mutateAsync(payload);
        addToast({ type: "success", message: "Booking created" });
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

  const handleCancel = async () => {
    if (mode?.kind !== "edit") return;
    if (!window.confirm("Cancel this booking? Channex availability will be restored.")) return;
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
          <textarea
            id="bk-notes"
            value={form.notes}
            onChange={(e) => update_({ notes: e.target.value })}
            rows={3}
            className="px-sm py-base text-body w-full rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        {error && (
          <p className="text-body text-status-danger" role="alert">
            {error}
          </p>
        )}

        <div className="gap-sm pt-sm flex items-center justify-end">
          {mode?.kind === "edit" && !isCancelled && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-sm py-base text-body rounded-lg border font-medium disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: "var(--status-danger)", color: "var(--status-danger)" }}
            >
              Cancel booking
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-sm py-base text-body rounded-lg border font-medium"
            style={{ borderColor: "var(--border)" }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-sm py-base text-body rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
          >
            {saving ? "Saving…" : mode?.kind === "edit" ? "Save changes" : "Create booking"}
          </button>
        </div>
      </div>
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
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-sm py-base text-body w-full rounded-lg border"
        style={{ borderColor: "var(--border)" }}
      />
    </div>
  );
}
