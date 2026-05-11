"use client";

import { useState } from "react";

import { useAppStore } from "@/stores/app-store";

export function CleaningSection() {
  const addToast = useAppStore((s) => s.addToast);
  const [defaultDuration, setDefaultDuration] = useState("2");
  const [autoAssign, setAutoAssign] = useState(false);
  const [defaultCleaner, setDefaultCleaner] = useState("Maria Santos");
  const [defaultCleanerEmail, setDefaultCleanerEmail] = useState("maria.s@cleanteam.com");

  const handleSave = () => {
    addToast({ type: "warning", message: "Settings save is coming soon, not wired up yet" });
  };

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading text-highlight-10 font-semibold">Cleaning</h2>
        <p className="text-body text-highlight-10">Default cleaning task configuration.</p>
      </div>

      <div className="space-y-sm">
        <div>
          <label className="mb-xs text-body text-highlight-10 block font-medium">
            Default Duration (hours)
          </label>
          {/* w-[144px] is on the Fibonacci ladder (5/8/13/21/34/55/89/144/...), kept as an arbitrary value. */}
          <input
            type="number"
            value={defaultDuration}
            onChange={(e) => setDefaultDuration(e.target.value)}
            min="0.5"
            step="0.5"
            className="px-sm py-base text-body w-[144px] rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        <div
          className="px-sm py-sm flex items-center justify-between rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <p id="auto-assign-label" className="text-body text-highlight-10 font-medium">
              Auto-assign Tasks
            </p>
            <p className="text-body text-highlight-10">
              Automatically assign cleaning tasks to the default cleaner
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoAssign}
            aria-labelledby="auto-assign-label"
            onClick={() => setAutoAssign(!autoAssign)}
            className="inline-flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
          >
            <span
              className="h-md relative w-lg rounded-full transition-colors"
              style={{
                backgroundColor: autoAssign ? "var(--strabb-secondary)" : "var(--neutral-30)",
              }}
            >
              {/* Toggle thumb pixel positions (18 / 2) are design-locked sub-token values. */}
              <span
                className="top-xs h-md bg-surface-60 absolute w-md rounded-full shadow transition-transform"
                style={{ left: autoAssign ? 18 : 2 }}
              />
            </span>
          </button>
        </div>

        <div>
          <label className="mb-xs text-body text-highlight-10 block font-medium">
            Default Cleaner Name
          </label>
          <input
            type="text"
            value={defaultCleaner}
            onChange={(e) => setDefaultCleaner(e.target.value)}
            className="px-sm py-base text-body w-full rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        <div>
          <label
            htmlFor="default-cleaner-email"
            className="mb-xs text-body text-highlight-10 block font-medium"
          >
            Default Cleaner Email
          </label>
          <input
            id="default-cleaner-email"
            type="email"
            autoComplete="email"
            value={defaultCleanerEmail}
            onChange={(e) => setDefaultCleanerEmail(e.target.value)}
            className="px-sm py-base text-body w-full rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
      </div>

      <div className="p-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <h3 className="mb-sm text-body text-highlight-10 font-semibold">Checklist Templates</h3>
        <div className="space-y-base text-body text-highlight-10">
          <div className="px-sm py-base hover:bg-neutral-30 flex items-center justify-between rounded-sm">
            <span>Standard Checkout Clean</span>
            <span className="text-body text-highlight-10">12 items</span>
          </div>
          <div className="px-sm py-base hover:bg-neutral-30 flex items-center justify-between rounded-sm">
            <span>Deep Clean</span>
            <span className="text-body text-highlight-10">18 items</span>
          </div>
          <div className="px-sm py-base hover:bg-neutral-30 flex items-center justify-between rounded-sm">
            <span>Quick Inspection</span>
            <span className="text-body text-highlight-10">5 items</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="px-sm py-base text-body text-surface-60 rounded-lg font-medium"
        style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
      >
        Save Changes
      </button>
    </div>
  );
}
