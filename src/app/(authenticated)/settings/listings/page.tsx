"use client";

import { Image as ImageIcon, Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useListingsAPI, useUpdateChannexMapping } from "@/lib/api-hooks/listings-api";
import { ApiError } from "@/lib/api-client";
import type { ListingResponse } from "@/lib/schemas/listing";
import { useAppStore } from "@/stores/app-store";

const CHANNEX_MAX_LENGTH = 255;

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

  // Channex mapping (real, persisted via API)
  const [channexInputs, setChannexInputs] = useState<Record<string, string>>({});
  const [channexErrors, setChannexErrors] = useState<Record<string, string | null>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    setChannexInputs((prev) => {
      const next = { ...prev };
      for (const l of listings) {
        if (next[l.id] === undefined) next[l.id] = l.channexPropertyId ?? "";
      }
      return next;
    });
  }, [listings]);

  const handleChannexChange = (id: string, value: string) => {
    setChannexInputs((prev) => ({ ...prev, [id]: value }));
    if (channexErrors[id]) setChannexErrors((prev) => ({ ...prev, [id]: null }));
  };

  const handleChannexSave = (listing: ListingResponse) => {
    const raw = channexInputs[listing.id] ?? "";
    const trimmed = raw.trim();
    if (trimmed.length > CHANNEX_MAX_LENGTH) {
      setChannexErrors((prev) => ({
        ...prev,
        [listing.id]: `Max ${CHANNEX_MAX_LENGTH} characters`,
      }));
      return;
    }
    const value = trimmed === "" ? null : trimmed;
    setSavingId(listing.id);
    updateMapping.mutate(
      { listingId: listing.id, channexPropertyId: value },
      {
        onSuccess: () => {
          addToast({
            type: "success",
            message: value
              ? `Channex mapping saved for ${listing.name}`
              : `Channex mapping cleared for ${listing.name}`,
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
        description="Photos, pricing, and amenities for each STRABB listing. Channel manager mapping sits at the bottom of each card."
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
        <div className="space-y-md">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              channexInput={channexInputs[listing.id] ?? ""}
              channexError={channexErrors[listing.id]}
              channexSaving={savingId === listing.id}
              onChannexChange={(v) => handleChannexChange(listing.id, v)}
              onChannexSave={() => handleChannexSave(listing)}
              onMetadataSave={handleMetadataSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ListingCardProps {
  listing: ListingResponse;
  channexInput: string;
  channexError: string | null | undefined;
  channexSaving: boolean;
  onChannexChange: (v: string) => void;
  onChannexSave: () => void;
  onMetadataSave: () => void;
}

function ListingCard({
  listing,
  channexInput,
  channexError,
  channexSaving,
  onChannexChange,
  onChannexSave,
  onMetadataSave,
}: ListingCardProps) {
  const channexStored = listing.channexPropertyId ?? "";
  const channexDirty = channexInput.trim() !== channexStored;

  return (
    <div className="rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <header className="px-sm py-sm border-b" style={{ borderColor: "var(--border)" }}>
        <p className="text-subheading text-highlight-10 font-semibold">{listing.name}</p>
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          {listing.platform}
        </p>
      </header>

      <div className="p-sm space-y-md">
        <PhotosSection />
        <PricingSection />
        <StaySection />
        <AmenitiesSection listingId={listing.id} />
        <DescriptionSection listingId={listing.id} />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onMetadataSave}
            className="px-sm py-base text-body rounded-lg font-medium"
            style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
          >
            Save metadata
          </button>
        </div>

        <hr style={{ borderColor: "var(--border)" }} />

        <ChannexMappingSection
          listingId={listing.id}
          value={channexInput}
          stored={channexStored}
          error={channexError}
          dirty={channexDirty}
          saving={channexSaving}
          onChange={onChannexChange}
          onSave={onChannexSave}
        />
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

interface ChannexMappingSectionProps {
  listingId: string;
  value: string;
  stored: string;
  error: string | null | undefined;
  dirty: boolean;
  saving: boolean;
  onChange: (v: string) => void;
  onSave: () => void;
}

function ChannexMappingSection({
  listingId,
  value,
  stored,
  error,
  dirty,
  saving,
  onChange,
  onSave,
}: ChannexMappingSectionProps) {
  return (
    <section className="space-y-xs">
      <div>
        <h3 className="text-body text-highlight-10 font-semibold">Channel manager mapping</h3>
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          Channex property ID this STRABB listing receives bookings from.
        </p>
      </div>
      <div className="gap-base flex items-center">
        <input
          id={`channex-${listingId}`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="abcd1234-aaaa-bbbb-cccc-dddddddddddd"
          maxLength={CHANNEX_MAX_LENGTH}
          aria-invalid={error != null}
          aria-describedby={error ? `channex-${listingId}-error` : undefined}
          className="font-data px-sm py-base text-body border-neutral-30 flex-1 rounded-lg border"
          style={{
            backgroundColor: "var(--surface-60)",
            color: "var(--highlight-10)",
          }}
        />
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saving}
          className="px-sm py-base text-body rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: "var(--highlight-10)",
            color: "var(--surface-60)",
          }}
        >
          {saving ? "Saving…" : value.trim() === stored ? "Saved" : "Save"}
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
