"use client";

import { useState } from "react";

import { useTenantMe, useUpdateSubdomain } from "@/lib/api-hooks/tenant-api";
import { ApiError } from "@/lib/api-client";
import { useAppStore } from "@/stores/app-store";

const SUBDOMAIN_REGEX = /^[a-z][a-z0-9-]{2,31}$/;

const RESERVED_SUBDOMAINS = new Set([
  "admin",
  "api",
  "www",
  "mail",
  "postmaster",
  "info",
  "support",
  "help",
  "root",
  "billing",
  "security",
  "noreply",
  "inbox",
]);

const validateSubdomain = (raw: string): string | null => {
  const value = raw.trim().toLowerCase();
  if (!value) return "Subdomain is required";
  if (!SUBDOMAIN_REGEX.test(value)) {
    return "Must be 3-32 chars, lowercase letters/digits/hyphens, starting with a letter";
  }
  if (RESERVED_SUBDOMAINS.has(value)) {
    return `'${value}' is a reserved subdomain - choose another`;
  }
  return null;
};

export function InboxSection() {
  const addToast = useAppStore((s) => s.addToast);
  const { data: tenant, isLoading } = useTenantMe();
  const updateSubdomain = useUpdateSubdomain();

  // null = unedited (mirror server). Anything else (including "") = user edit.
  // Derived value over useEffect-sync so there's no race between mount and
  // server data arrival.
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stored = tenant?.subdomain ?? "";
  const input = draft ?? stored;

  const handleSave = () => {
    const validation = validateSubdomain(input);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    const value = input.trim().toLowerCase();
    updateSubdomain.mutate(value, {
      onSuccess: () => {
        // Drop the draft so the input mirrors the new server value.
        setDraft(null);
        addToast({ type: "success", message: "Subdomain saved" });
      },
      onError: (err: unknown) => {
        if (err instanceof ApiError && err.status === 409) {
          setError("Subdomain is already taken - choose another");
          return;
        }
        if (err instanceof ApiError && err.status === 422) {
          setError(err.message);
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to save subdomain";
        addToast({ type: "error", message });
      },
    });
  };

  const dirty = input.trim().toLowerCase() !== stored.toLowerCase();
  const inboxAddress = tenant?.subdomain ? `${tenant.subdomain}@inbox.strabb.io` : null;

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading text-highlight-10 font-semibold">Inbox</h2>
        <p className="text-body text-highlight-10">
          Forward emails from Airbnb, Booking.com, and other channels to your tenant inbox to
          capture guest messages in STRABB.
        </p>
      </div>

      {isLoading ? (
        <p
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="text-body"
          style={{ color: "var(--text-secondary)" }}
        >
          Loading…
        </p>
      ) : (
        <div className="space-y-sm max-w-md">
          <div>
            <label htmlFor="inbox-subdomain" className="text-body text-highlight-10 mb-xs block">
              Subdomain
            </label>
            <div className="gap-base flex items-center">
              <input
                id="inbox-subdomain"
                type="text"
                value={input}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="mytenant"
                aria-invalid={error != null}
                aria-describedby={error ? "inbox-subdomain-error" : "inbox-subdomain-hint"}
                className="px-sm py-base text-body border-neutral-30 flex-1 rounded-lg border"
                style={{ backgroundColor: "var(--surface-60)", color: "var(--highlight-10)" }}
              />
              <span className="text-body" style={{ color: "var(--text-secondary)" }}>
                @inbox.strabb.io
              </span>
            </div>
            {error ? (
              <p id="inbox-subdomain-error" className="text-body text-status-danger mt-xs">
                {error}
              </p>
            ) : (
              <p
                id="inbox-subdomain-hint"
                className="text-body mt-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                3-32 chars, lowercase letters/digits/hyphens, starting with a letter.
              </p>
            )}
          </div>

          {inboxAddress && !dirty && (
            <div className="p-sm rounded-lg" style={{ backgroundColor: "var(--neutral-30)" }}>
              <p className="text-body text-highlight-10">
                Your inbox address: <span className="font-data font-semibold">{inboxAddress}</span>
              </p>
            </div>
          )}

          <div className="gap-base flex items-center">
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || updateSubdomain.isPending}
              className="px-sm py-base text-body text-surface-60 rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
            >
              {updateSubdomain.isPending ? "Saving…" : "Save"}
            </button>
            {dirty && tenant?.subdomain && (
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setError(null);
                }}
                className="px-sm py-base text-body text-highlight-10 hover:bg-neutral-30 rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
