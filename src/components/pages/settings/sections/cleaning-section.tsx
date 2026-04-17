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
    addToast({ type: "success", message: "Cleaning settings saved" });
  };

  return (
    <div className="max-w-lg space-y-md">
      <div>
        <h2 className="text-subheading font-semibold text-gray-900">Cleaning</h2>
        <p className="text-body text-gray-500">Default cleaning task configuration.</p>
      </div>

      <div className="space-y-sm">
        <div>
          <label className="mb-xs block text-body font-medium text-gray-700">
            Default Duration (hours)
          </label>
          <input
            type="number"
            value={defaultDuration}
            onChange={(e) => setDefaultDuration(e.target.value)}
            min="0.5"
            step="0.5"
            className="w-[144px] rounded-lg border px-sm py-base text-body"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        <div
          className="flex items-center justify-between rounded-lg border px-sm py-sm"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <p className="text-body font-medium text-gray-800">Auto-assign Tasks</p>
            <p className="text-body text-gray-500">
              Automatically assign cleaning tasks to the default cleaner
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoAssign(!autoAssign)}
            className="relative h-md w-lg rounded-full transition-colors"
            style={{
              backgroundColor: autoAssign ? "var(--strabb-secondary)" : "#D1D5DB",
            }}
          >
            <span
              className="absolute top-xs h-md w-md rounded-full bg-white shadow transition-transform"
              style={{ left: autoAssign ? 18 : 2 }}
            />
          </button>
        </div>

        <div>
          <label className="mb-xs block text-body font-medium text-gray-700">
            Default Cleaner Name
          </label>
          <input
            type="text"
            value={defaultCleaner}
            onChange={(e) => setDefaultCleaner(e.target.value)}
            className="w-full rounded-lg border px-sm py-base text-body"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        <div>
          <label className="mb-xs block text-body font-medium text-gray-700">
            Default Cleaner Email
          </label>
          <input
            type="email"
            value={defaultCleanerEmail}
            onChange={(e) => setDefaultCleanerEmail(e.target.value)}
            className="w-full rounded-lg border px-sm py-base text-body"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
      </div>

      <div className="rounded-lg border p-sm" style={{ borderColor: "var(--border)" }}>
        <h3 className="mb-sm text-body font-semibold text-gray-700">Checklist Templates</h3>
        <div className="space-y-base text-body text-gray-500">
          <div className="flex items-center justify-between rounded-sm px-sm py-base hover:bg-gray-50">
            <span>Standard Checkout Clean</span>
            <span className="text-body text-gray-400">12 items</span>
          </div>
          <div className="flex items-center justify-between rounded-sm px-sm py-base hover:bg-gray-50">
            <span>Deep Clean</span>
            <span className="text-body text-gray-400">18 items</span>
          </div>
          <div className="flex items-center justify-between rounded-sm px-sm py-base hover:bg-gray-50">
            <span>Quick Inspection</span>
            <span className="text-body text-gray-400">5 items</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="rounded-lg px-sm py-base text-body font-medium text-white"
        style={{ backgroundColor: "var(--strabb-secondary)" }}
      >
        Save Changes
      </button>
    </div>
  );
}
