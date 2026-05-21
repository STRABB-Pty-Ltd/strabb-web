"use client";

import { Image as ImageIcon, Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ListingRow } from "@/components/listings/listing-row";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useListingsAPI, useUpdateChannexMapping } from "@/lib/api-hooks/listings-api";
import { ApiError } from "@/lib/api-client";
import type { ListingResponse } from "@/lib/schemas/listing";
import { useAppStore } from "@/stores/app-store";

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

// Mock amenity list. Real source will be a tenant-level amenity catalogue
// once the backend ships listing metadata - for now the checkboxes are
// here to anchor the layout and let Will eyeball the spec.
const AMENITIES = [
  "Wi-Fi",
  "Air conditioning",
  "Heating",
  "Kitchen",
  "Washer",
  "Dryer",
  "Pool",
  "Hot tub",
  "Parking",
  "EV charger",
  "Pet friendly",
  "BBQ",
  "Workspace",
  "Smart TV",
] as const;

export default function SettingsListingsPage() {
  const { data, isLoading } = useListingsAPI();
  const updateMapping = useUpdateChannexMapping();
  const addToast = useAppStore((s) => s.addToast);

  const listings = useMemo(() => data?.data ?? [], [data?.data]);

  // Channex mapping inputs (kept at page level so values survive row
  // collapse/expand — closing a row doesn't blow away a user's in-flight
  // edit on the Channex tab). All three IDs are tracked per listing so
  // a single Save sends them together.
  const [channexInputs, setChannexInputs] = useState<Record<string, ChannexInputState>>({});
  const [channexErrors, setChannexErrors] = useState<Record<string, string | null>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

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
  }, [listings]);

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

  const handleMetadataSave = () => {
    addToast({
      type: "warning",
      message: "Listing metadata save is coming soon, not wired up yet",
    });
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
              baseNightlyRate={
                null /* TODO: thread Listing.nightly_rate when API exposes it on response */
              }
              generalTabContent={<GeneralTab listingId={listing.id} onSave={handleMetadataSave} />}
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
    </div>
  );
}

// ---------------------------------------------------------------------
// General tab — placeholder metadata sections (not wired to a save
// endpoint yet; the existing inline form was always mock UI).
// ---------------------------------------------------------------------

function GeneralTab({ listingId, onSave }: { listingId: string; onSave: () => void }) {
  return (
    <div className="space-y-md">
      <PhotosSection />
      <PricingSection />
      <StaySection />
      <AmenitiesSection listingId={listingId} />
      <DescriptionSection listingId={listingId} />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          className="px-sm py-base text-body rounded-lg font-medium"
          style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
        >
          Save metadata
        </button>
      </div>
    </div>
  );
}

function PhotosSection() {
  return (
    <section className="space-y-xs">
      <h3 className="text-body text-highlight-10 font-semibold">Photos</h3>
      <div
        className="p-md flex flex-col items-center justify-center rounded-lg border border-dashed"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
      >
        <ImageIcon size={24} aria-hidden="true" />
        <p className="mt-xs text-body">Drag images here or click to upload (coming soon)</p>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="space-y-xs">
      <h3 className="text-body text-highlight-10 font-semibold">Pricing</h3>
      <div className="gap-sm grid grid-cols-2">
        <div>
          <label className="mb-xs text-body text-highlight-10 block font-medium">
            Base nightly rate
          </label>
          <input
            type="number"
            placeholder="285"
            className="px-sm py-base text-body w-full rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
        <div>
          <label className="mb-xs text-body text-highlight-10 block font-medium">
            Cleaning fee
          </label>
          <input
            type="number"
            placeholder="120"
            className="px-sm py-base text-body w-full rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
      </div>
    </section>
  );
}

function StaySection() {
  return (
    <section className="space-y-xs">
      <h3 className="text-body text-highlight-10 font-semibold">Stay rules</h3>
      <div className="gap-sm grid grid-cols-2">
        <div>
          <label className="mb-xs text-body text-highlight-10 block font-medium">Min nights</label>
          <input
            type="number"
            placeholder="2"
            className="px-sm py-base text-body w-full rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
        <div>
          <label className="mb-xs text-body text-highlight-10 block font-medium">Max nights</label>
          <input
            type="number"
            placeholder="30"
            className="px-sm py-base text-body w-full rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
      </div>
    </section>
  );
}

function AmenitiesSection({ listingId }: { listingId: string }) {
  return (
    <section className="space-y-xs">
      <h3 className="text-body text-highlight-10 font-semibold">Amenities</h3>
      <div className="gap-base grid grid-cols-2 sm:grid-cols-3">
        {AMENITIES.map((a) => (
          <label
            key={a}
            className="gap-base text-body text-highlight-10 flex items-center"
            htmlFor={`amenity-${listingId}-${a}`}
          >
            <input id={`amenity-${listingId}-${a}`} type="checkbox" className="h-sm w-sm rounded" />
            {a}
          </label>
        ))}
      </div>
    </section>
  );
}

function DescriptionSection({ listingId }: { listingId: string }) {
  return (
    <section className="space-y-xs">
      <label
        htmlFor={`desc-${listingId}`}
        className="text-body text-highlight-10 block font-semibold"
      >
        Description
      </label>
      <textarea
        id={`desc-${listingId}`}
        rows={4}
        placeholder="What makes this listing distinctive? Guests see this on the OTA detail page."
        className="px-sm py-base text-body w-full rounded-lg border"
        style={{ borderColor: "var(--border)" }}
      />
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
