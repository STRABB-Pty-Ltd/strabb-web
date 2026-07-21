"use client";

import { Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ListingRow } from "@/components/listings/listing-row";
import { BookingFormDrawer } from "@/components/overlays/booking-form-drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  useListingsAPI,
  useChannexResyncListing,
  useUpdateChannexMapping,
  useUpdateListing,
} from "@/lib/api-hooks/listings-api";
import { ApiError } from "@/lib/api-client";
import type { ListingResponse } from "@/lib/schemas/listing";
import { useAppStore } from "@/stores/app-store";
import { useProperties, useUpdateProperty } from "@/hooks/use-properties";

const CHANNEX_MAX_LENGTH = 255;

interface ChannexInputState {
  propertyId: string;
  roomTypeId: string;
  ratePlanId: string;
}

const EMPTY_CHANNEX_INPUT: ChannexInputState = {
  propertyId: "",
  roomTypeId: "",
  ratePlanId: "",
};

export default function SettingsListingsPage() {
  const { data, isLoading } = useListingsAPI();
  const updateMapping = useUpdateChannexMapping();
  const updateListing = useUpdateListing();
  const addToast = useAppStore((s) => s.addToast);

  const listings = useMemo(() => data?.data ?? [], [data?.data]);

  // Cleaning duration lives on the Property, not the Listing (api:
  // app/models/property.py cleaning_duration_minutes, used as the task
  // scheduling fallback in app/services/cleaning_task.py). Several listings
  // can share one property, so this is fetched + saved via the properties
  // endpoint, keyed by propertyId rather than listingId.
  const { data: propertiesData } = useProperties();
  const updateProperty = useUpdateProperty();
  const properties = useMemo(() => propertiesData?.data ?? [], [propertiesData?.data]);

  // Channex mapping inputs (kept at page level so values survive row
  // collapse/expand — closing a row doesn't blow away a user's in-flight
  // edit on the Channex tab). All three IDs are tracked per listing so
  // a single Save sends them together.
  const [channexInputs, setChannexInputs] = useState<Record<string, ChannexInputState>>({});
  const [channexErrors, setChannexErrors] = useState<Record<string, string | null>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Per-listing General-tab inputs. `nightlyRate` is wired to a real save
  // endpoint (PUT /listings/{id}); cleaning duration below is wired to the
  // properties endpoint. The former placeholder inputs (photos, cleaning
  // fee, stay rules, amenities, description) were removed as dead
  // affordances; they return as deliberate post-launch items once the
  // backend ships listing metadata.
  const [nightlyRateInputs, setNightlyRateInputs] = useState<Record<string, string>>({});
  const [savingMetadataId, setSavingMetadataId] = useState<string | null>(null);

  // Keyed by propertyId (not listingId), see the useProperties() comment above.
  const [cleaningDurationInputs, setCleaningDurationInputs] = useState<Record<string, string>>({});
  const [savingCleaningId, setSavingCleaningId] = useState<string | null>(null);

  // Manual-booking create flow. The Add Booking button per listing
  // opens the shared form drawer (also used in edit mode from the
  // /bookings detail drawer) pre-filled with that listing.
  const [addBookingListingId, setAddBookingListingId] = useState<string | null>(null);

  useEffect(() => {
    setChannexInputs((prev) => {
      const next = { ...prev };
      for (const l of listings) {
        if (next[l.id] === undefined) {
          next[l.id] = {
            propertyId: l.channexPropertyId ?? "",
            roomTypeId: l.channexRoomTypeId ?? "",
            ratePlanId: l.channexRatePlanId ?? "",
          };
        }
      }
      return next;
    });
    setNightlyRateInputs((prev) => {
      const next = { ...prev };
      for (const l of listings) {
        if (next[l.id] === undefined) {
          next[l.id] = l.nightlyRate != null ? String(l.nightlyRate) : "";
        }
      }
      return next;
    });
  }, [listings]);

  useEffect(() => {
    setCleaningDurationInputs((prev) => {
      const next = { ...prev };
      for (const p of properties) {
        if (next[p.id] === undefined) {
          next[p.id] = String(p.cleaningDurationMinutes);
        }
      }
      return next;
    });
  }, [properties]);

  const handleChannexFieldChange = (id: string, field: keyof ChannexInputState, value: string) => {
    setChannexInputs((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? EMPTY_CHANNEX_INPUT), [field]: value },
    }));
    if (channexErrors[id]) setChannexErrors((prev) => ({ ...prev, [id]: null }));
  };

  const handleChannexSave = (listing: ListingResponse) => {
    const inputs = channexInputs[listing.id] ?? EMPTY_CHANNEX_INPUT;
    const property = inputs.propertyId.trim();
    const room = inputs.roomTypeId.trim();
    const rate = inputs.ratePlanId.trim();

    for (const [label, raw] of [
      ["property", property],
      ["room type", room],
      ["rate plan", rate],
    ] as const) {
      if (raw.length > CHANNEX_MAX_LENGTH) {
        setChannexErrors((prev) => ({
          ...prev,
          [listing.id]: `Channex ${label} ID exceeds ${CHANNEX_MAX_LENGTH} characters`,
        }));
        return;
      }
    }

    setSavingId(listing.id);
    updateMapping.mutate(
      {
        listingId: listing.id,
        channexPropertyId: property === "" ? null : property,
        channexRoomTypeId: room === "" ? null : room,
        channexRatePlanId: rate === "" ? null : rate,
      },
      {
        onSuccess: () => {
          addToast({
            type: "success",
            message: `Channex mapping saved for ${listing.name}`,
          });
        },
        onError: (err: unknown) => {
          if (err instanceof ApiError && err.status === 409) {
            setChannexErrors((prev) => ({
              ...prev,
              [listing.id]: "This Channex property is already mapped to another listing",
            }));
            return;
          }
          if (err instanceof ApiError && err.status === 422) {
            setChannexErrors((prev) => ({ ...prev, [listing.id]: err.message }));
            return;
          }
          const message = err instanceof Error ? err.message : "Failed to save mapping";
          addToast({ type: "error", message });
        },
        onSettled: () => {
          setSavingId(null);
        },
      },
    );
  };

  const handleMetadataSave = (listing: ListingResponse) => {
    const raw = (nightlyRateInputs[listing.id] ?? "").trim();
    // Empty input clears the override (null = use OTA/listing-level
    // default). Otherwise parse as a non-negative number.
    let nightlyRate: number | null;
    if (raw === "") {
      nightlyRate = null;
    } else {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        addToast({
          type: "error",
          message: "Base nightly rate must be a non-negative number",
        });
        return;
      }
      nightlyRate = parsed;
    }

    const stored = listing.nightlyRate;
    if (nightlyRate === stored) {
      addToast({ type: "info", message: "Nothing to save" });
      return;
    }

    setSavingMetadataId(listing.id);
    updateListing.mutate(
      { listingId: listing.id, nightlyRate },
      {
        onSuccess: () => {
          addToast({
            type: "success",
            message: `Metadata saved for ${listing.name}`,
          });
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : "Failed to save metadata";
          addToast({ type: "error", message });
        },
        onSettled: () => {
          setSavingMetadataId(null);
        },
      },
    );
  };

  const handleNightlyRateChange = (id: string, value: string) => {
    setNightlyRateInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleCleaningDurationChange = (propertyId: string, value: string) => {
    setCleaningDurationInputs((prev) => ({ ...prev, [propertyId]: value }));
  };

  const handleCleaningDurationSave = (propertyId: string) => {
    const raw = (cleaningDurationInputs[propertyId] ?? "").trim();
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0 || parsed > 1440) {
      addToast({
        type: "error",
        message: "Cleaning duration must be a whole number of minutes from 0 to 1440",
      });
      return;
    }

    const property = properties.find((p) => p.id === propertyId);
    if (property && parsed === property.cleaningDurationMinutes) {
      addToast({ type: "info", message: "Nothing to save" });
      return;
    }

    setSavingCleaningId(propertyId);
    updateProperty.mutate(
      { id: propertyId, data: { cleaningDurationMinutes: parsed } },
      {
        onSuccess: () => {
          addToast({
            type: "success",
            message: `Cleaning duration saved for ${property?.name ?? "property"}`,
          });
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : "Failed to save cleaning duration";
          addToast({ type: "error", message });
        },
        onSettled: () => {
          setSavingCleaningId(null);
        },
      },
    );
  };

  return (
    <div className="p-md space-y-md">
      <PageHeader
        title="Listings"
        description="Click a listing to expand it and edit pricing, restrictions, availability, and channel-manager mapping."
      />

      {isLoading ? (
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          Loading listings…
        </p>
      ) : listings.length === 0 ? (
        <div className="rounded-md border">
          <EmptyState
            icon={Inbox}
            title="No listings yet"
            description="Create a listing first, then come back to add metadata."
          />
        </div>
      ) : (
        <div className="space-y-base">
          {listings.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              baseNightlyRate={listing.nightlyRate}
              generalTabContent={
                <GeneralTab
                  listingId={listing.id}
                  nightlyRateInput={nightlyRateInputs[listing.id] ?? ""}
                  onNightlyRateChange={(v) => handleNightlyRateChange(listing.id, v)}
                  saving={savingMetadataId === listing.id}
                  onSave={() => handleMetadataSave(listing)}
                  onAddBooking={() => setAddBookingListingId(listing.id)}
                  cleaningDurationInput={cleaningDurationInputs[listing.propertyId] ?? ""}
                  storedCleaningDurationMinutes={
                    properties.find((p) => p.id === listing.propertyId)?.cleaningDurationMinutes ??
                    null
                  }
                  onCleaningDurationChange={(v) =>
                    handleCleaningDurationChange(listing.propertyId, v)
                  }
                  savingCleaningDuration={savingCleaningId === listing.propertyId}
                  onSaveCleaningDuration={() => handleCleaningDurationSave(listing.propertyId)}
                />
              }
              channexTabContent={
                <ChannexMappingSection
                  listingId={listing.id}
                  values={channexInputs[listing.id] ?? EMPTY_CHANNEX_INPUT}
                  stored={{
                    propertyId: listing.channexPropertyId ?? "",
                    roomTypeId: listing.channexRoomTypeId ?? "",
                    ratePlanId: listing.channexRatePlanId ?? "",
                  }}
                  error={channexErrors[listing.id]}
                  saving={savingId === listing.id}
                  onChange={(field, v) => handleChannexFieldChange(listing.id, field, v)}
                  onSave={() => handleChannexSave(listing)}
                />
              }
            />
          ))}
        </div>
      )}
      <BookingFormDrawer
        open={addBookingListingId !== null}
        onClose={() => setAddBookingListingId(null)}
        mode={addBookingListingId ? { kind: "create", listingId: addBookingListingId } : null}
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// General tab.
//
// The Base nightly rate input is wired to a real save endpoint
// (PUT /listings/{id}). Cleaning duration is wired to the properties
// endpoint (PUT /properties/{id}): it is a per-Property field shared by
// every listing on that property, not a per-listing one; see the
// useProperties() comment on the page component. The former placeholder
// sections (photos, cleaning fee, stay rules, amenities, description)
// were removed as dead affordances; they return as deliberate
// post-launch items once the backend ships listing metadata.
// ---------------------------------------------------------------------

interface GeneralTabProps {
  listingId: string;
  nightlyRateInput: string;
  onNightlyRateChange: (value: string) => void;
  saving: boolean;
  onSave: () => void;
  onAddBooking: () => void;
  cleaningDurationInput: string;
  storedCleaningDurationMinutes: number | null;
  onCleaningDurationChange: (value: string) => void;
  savingCleaningDuration: boolean;
  onSaveCleaningDuration: () => void;
}

function GeneralTab({
  listingId,
  nightlyRateInput,
  onNightlyRateChange,
  saving,
  onSave,
  onAddBooking,
  cleaningDurationInput,
  storedCleaningDurationMinutes,
  onCleaningDurationChange,
  savingCleaningDuration,
  onSaveCleaningDuration,
}: GeneralTabProps) {
  return (
    <div className="space-y-md">
      <PricingSection
        nightlyRateInput={nightlyRateInput}
        onNightlyRateChange={onNightlyRateChange}
      />
      <CleaningDurationSection
        listingId={listingId}
        value={cleaningDurationInput}
        storedMinutes={storedCleaningDurationMinutes}
        saving={savingCleaningDuration}
        onChange={onCleaningDurationChange}
        onSave={onSaveCleaningDuration}
      />

      <section
        className="pt-sm border-t"
        style={{ borderColor: "var(--border)" }}
        data-testid={`add-booking-${listingId}`}
      >
        <h3 className="text-body text-highlight-10 font-semibold">Manual booking</h3>
        <p className="text-body mb-xs" style={{ color: "var(--text-secondary)" }}>
          Create a host-side booking against this listing. STRABB pushes the availability change to
          Channex automatically.
        </p>
        <button
          type="button"
          onClick={onAddBooking}
          className="px-sm py-base text-body rounded-lg border font-medium"
          style={{ borderColor: "var(--border)", color: "var(--highlight-10)" }}
        >
          + Add booking
        </button>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-sm py-base text-body rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
        >
          {saving ? "Saving…" : "Save metadata"}
        </button>
      </div>
    </div>
  );
}

interface PricingSectionProps {
  nightlyRateInput: string;
  onNightlyRateChange: (value: string) => void;
}

function PricingSection({ nightlyRateInput, onNightlyRateChange }: PricingSectionProps) {
  return (
    <section className="space-y-xs">
      <h3 className="text-body text-highlight-10 font-semibold">Pricing</h3>
      <div className="gap-sm grid grid-cols-1 md:grid-cols-2">
        <div>
          <label
            htmlFor="base-nightly-rate"
            className="mb-xs text-body text-highlight-10 block font-medium"
          >
            Base nightly rate
          </label>
          <input
            id="base-nightly-rate"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="285.00"
            value={nightlyRateInput}
            onChange={(e) => onNightlyRateChange(e.target.value)}
            className="px-sm py-base text-body w-full rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
          <p className="mt-xs text-body" style={{ color: "var(--text-secondary)" }}>
            Falls back to this rate for any date with no per-date override.
          </p>
        </div>
      </div>
    </section>
  );
}

interface CleaningDurationSectionProps {
  listingId: string;
  value: string;
  storedMinutes: number | null;
  saving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}

// Real field: api's Property.cleaning_duration_minutes (default 120), the
// task-scheduling fallback duration in cleaning_task.py. It lives on the
// Property, so every listing sharing this row's property shows and saves
// the same value, that is expected, not a bug.
function CleaningDurationSection({
  listingId,
  value,
  storedMinutes,
  saving,
  onChange,
  onSave,
}: CleaningDurationSectionProps) {
  const dirty = value.trim() !== String(storedMinutes ?? "");
  const inputId = `cleaning-duration-${listingId}`;

  return (
    <section className="space-y-xs">
      <h3 className="text-body text-highlight-10 font-semibold">Cleaning</h3>
      <div>
        <label htmlFor={inputId} className="mb-xs text-body text-highlight-10 block font-medium">
          Cleaning duration (minutes)
        </label>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={0}
          max={1440}
          step={1}
          placeholder="120"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-sm py-base text-body w-full rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        />
        <p className="mt-xs text-body" style={{ color: "var(--text-secondary)" }}>
          Time blocked for the cleaning task after checkout. Shared across every listing on this
          property.
        </p>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saving}
          className="px-sm py-base text-body rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
        >
          {saving ? "Saving…" : dirty ? "Save" : "Saved"}
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// Channex tab — channel-manager mapping form (existing logic from before
// the F.7b refactor; unchanged).
// ---------------------------------------------------------------------

interface ChannexMappingSectionProps {
  listingId: string;
  values: ChannexInputState;
  stored: ChannexInputState;
  error: string | null | undefined;
  saving: boolean;
  onChange: (field: keyof ChannexInputState, value: string) => void;
  onSave: () => void;
}

function ChannexMappingSection({
  listingId,
  values,
  stored,
  error,
  saving,
  onChange,
  onSave,
}: ChannexMappingSectionProps) {
  // Dirty = any of the three inputs differs from the stored value.
  // Empty string and null both count as "unset"; trim before comparing
  // so trailing whitespace doesn't keep the button enabled forever.
  const dirty =
    values.propertyId.trim() !== stored.propertyId ||
    values.roomTypeId.trim() !== stored.roomTypeId ||
    values.ratePlanId.trim() !== stored.ratePlanId;

  const resync = useChannexResyncListing();
  const canResync = stored.propertyId.length > 0;
  const handleResync = async () => {
    try {
      await resync.mutateAsync(listingId);
      useAppStore.getState().addToast({ type: "success", message: "Full sync queued for Channex" });
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : "Failed to queue full sync";
      useAppStore.getState().addToast({ type: "error", message });
    }
  };

  return (
    <section className="space-y-sm">
      <div>
        <h3 className="text-body text-highlight-10 font-semibold">Channel manager mapping</h3>
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          All three Channex IDs together identify this STRABB listing inside Channex. All three are
          required before availability + rates + restrictions can be pushed.
        </p>
      </div>
      <ChannexIdField
        id={`channex-prop-${listingId}`}
        label="Property ID"
        helper="Channex property this STRABB listing receives bookings from."
        value={values.propertyId}
        error={error != null}
        onChange={(v) => onChange("propertyId", v)}
      />
      <ChannexIdField
        id={`channex-room-${listingId}`}
        label="Room type ID"
        helper="Channex room type within the property — the bookable unit."
        value={values.roomTypeId}
        error={error != null}
        onChange={(v) => onChange("roomTypeId", v)}
      />
      <ChannexIdField
        id={`channex-rate-${listingId}`}
        label="Rate plan ID"
        helper="Channex rate plan whose pricing + restrictions STRABB writes to."
        value={values.ratePlanId}
        error={error != null}
        onChange={(v) => onChange("ratePlanId", v)}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saving}
          className="px-sm py-base text-body rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
        >
          {saving ? "Saving…" : dirty ? "Save" : "Saved"}
        </button>
      </div>
      {error && (
        <p id={`channex-${listingId}-error`} className="text-body text-status-danger">
          {error}
        </p>
      )}

      <div
        className="pt-sm border-t"
        style={{ borderColor: "var(--border)" }}
        data-testid={`channex-resync-${listingId}`}
      >
        <h4 className="text-body text-highlight-10 font-semibold">Force full sync</h4>
        <p className="text-body mb-xs" style={{ color: "var(--text-secondary)" }}>
          Re-pushes 500 days of availability + rates + restrictions to Channex. Use after fixing a
          mapping or if a previous sync failed. Requires the Property ID to be saved first.
        </p>
        <button
          type="button"
          onClick={handleResync}
          disabled={!canResync || resync.isPending}
          className="px-sm py-base text-body rounded-lg border font-medium disabled:cursor-not-allowed disabled:opacity-60"
          style={{ borderColor: "var(--border)", color: "var(--highlight-10)" }}
        >
          {resync.isPending ? "Queuing…" : "Force full sync now"}
        </button>
      </div>
    </section>
  );
}

interface ChannexIdFieldProps {
  id: string;
  label: string;
  helper: string;
  value: string;
  error: boolean;
  onChange: (v: string) => void;
}

function ChannexIdField({ id, label, helper, value, error, onChange }: ChannexIdFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-xs text-body text-highlight-10 block font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="abcd1234-aaaa-bbbb-cccc-dddddddddddd"
        maxLength={CHANNEX_MAX_LENGTH}
        aria-invalid={error}
        className="font-data px-sm py-base text-body border-neutral-30 w-full rounded-lg border"
        style={{ backgroundColor: "var(--surface-60)", color: "var(--highlight-10)" }}
      />
      <p className="mt-xs text-body" style={{ color: "var(--text-secondary)" }}>
        {helper}
      </p>
    </div>
  );
}
