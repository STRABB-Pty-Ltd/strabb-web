"use client";

import { Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useListingsAPI, useUpdateChannexMapping } from "@/lib/api-hooks/listings-api";
import { ApiError } from "@/lib/api-client";
import type { ListingResponse } from "@/lib/schemas/listing";
import { useAppStore } from "@/stores/app-store";

const MAX_LENGTH = 255;

export default function SettingsListingsPage() {
  const { data, isLoading } = useListingsAPI();
  const updateMapping = useUpdateChannexMapping();
  const addToast = useAppStore((s) => s.addToast);

  const listings = useMemo(() => data?.data ?? [], [data?.data]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    setInputs((prev) => {
      const next = { ...prev };
      for (const l of listings) {
        if (next[l.id] === undefined) next[l.id] = l.channexPropertyId ?? "";
      }
      return next;
    });
  }, [listings]);

  const handleChange = (id: string, value: string) => {
    setInputs((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: null }));
  };

  const handleSave = (listing: ListingResponse) => {
    const raw = inputs[listing.id] ?? "";
    const trimmed = raw.trim();
    if (trimmed.length > MAX_LENGTH) {
      setErrors((prev) => ({
        ...prev,
        [listing.id]: `Max ${MAX_LENGTH} characters`,
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
            setErrors((prev) => ({
              ...prev,
              [listing.id]: "This Channex property is already mapped to another listing",
            }));
            return;
          }
          if (err instanceof ApiError && err.status === 422) {
            setErrors((prev) => ({ ...prev, [listing.id]: err.message }));
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

  return (
    <div className="p-md space-y-md">
      <PageHeader
        title="Listings"
        description="Map each STRABB listing to its Channex property so ingested bookings land on the right listing."
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
            description="Create a listing to start mapping it to Channex."
          />
        </div>
      ) : (
        <div className="space-y-sm">
          {listings.map((listing) => {
            const current = inputs[listing.id] ?? "";
            const stored = listing.channexPropertyId ?? "";
            const dirty = current.trim() !== stored;
            const rowError = errors[listing.id];
            const inFlight = savingId === listing.id;
            return (
              <div
                key={listing.id}
                className="p-sm rounded-lg border"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="gap-sm flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-body text-highlight-10 font-semibold">{listing.name}</p>
                    <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                      {listing.platform}
                    </p>
                  </div>
                </div>
                <div className="mt-sm space-y-xs">
                  <label
                    htmlFor={`channex-${listing.id}`}
                    className="text-body text-highlight-10 block"
                  >
                    Channex property ID
                  </label>
                  <div className="gap-base flex items-center">
                    <input
                      id={`channex-${listing.id}`}
                      type="text"
                      value={current}
                      onChange={(e) => handleChange(listing.id, e.target.value)}
                      placeholder="abcd1234-aaaa-bbbb-cccc-dddddddddddd"
                      maxLength={MAX_LENGTH}
                      aria-invalid={rowError != null}
                      aria-describedby={rowError ? `channex-${listing.id}-error` : undefined}
                      className="font-data px-sm py-base text-body border-neutral-30 flex-1 rounded-lg border"
                      style={{
                        backgroundColor: "var(--surface-60)",
                        color: "var(--highlight-10)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSave(listing)}
                      disabled={!dirty || inFlight}
                      className="px-sm py-base text-body rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        backgroundColor: "var(--strabb-secondary)",
                        color: "var(--surface-60)",
                      }}
                    >
                      {inFlight ? "Saving…" : current.trim() === stored ? "Saved" : "Save"}
                    </button>
                  </div>
                  {rowError && (
                    <p id={`channex-${listing.id}-error`} className="text-body text-status-danger">
                      {rowError}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
