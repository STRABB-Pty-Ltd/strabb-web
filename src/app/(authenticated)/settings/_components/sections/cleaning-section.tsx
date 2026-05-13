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
          <label
            htmlFor="cleaning-default-duration"
            className="mb-xs text-body text-highlight-10 block font-medium"
          >
            Default Duration (hours)
          </label>
          {/* w-[144px] is on the Fibonacci ladder (5/8/13/21/34/55/89/144/...), kept as an arbitrary value. */}
          <input
            id="cleaning-default-duration"
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
            className="h-md relative w-lg rounded-full transition-colors outline-none before:absolute before:top-1/2 before:left-1/2 before:h-[var(--touch-target-min)] before:w-[var(--touch-target-min)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            style={{
              backgroundColor: autoAssign ? "var(--highlight-10)" : "var(--neutral-30)",
            }}
          >
            {/* Thumb 14x14 with locked left positions (2 / 18) gives symmetric 2px margins inside a w-lg (34px) track. */}
            <span
              className="bg-surface-60 absolute top-[3px] h-[14px] w-[14px] rounded-full shadow transition-transform"
              style={{ left: autoAssign ? 18 : 2 }}
            />
          </button>
        </div>

        <div>
          <label
            htmlFor="cleaning-default-cleaner-name"
            className="mb-xs text-body text-highlight-10 block font-medium"
          >
            Default Cleaner Name
          </label>
          <input
            id="cleaning-default-cleaner-name"
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
        style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
      >
        Save Changes
      </button>
    </div>
  );
}
