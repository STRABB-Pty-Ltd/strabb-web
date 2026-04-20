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
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading font-semibold text-gray-900">Cleaning</h2>
        <p className="text-body text-gray-500">Default cleaning task configuration.</p>
      </div>

      <div className="space-y-sm">
        <div>
          <label className="mb-xs text-body block font-medium text-gray-700">
            Default Duration (hours)
          </label>
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
            <p className="text-body font-medium text-gray-800">Auto-assign Tasks</p>
            <p className="text-body text-gray-500">
              Automatically assign cleaning tasks to the default cleaner
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoAssign(!autoAssign)}
            className="h-md relative w-lg rounded-full transition-colors"
            style={{
              backgroundColor: autoAssign ? "var(--strabb-secondary)" : "var(--neutral-30)",
            }}
          >
            <span
              className="top-xs h-md absolute w-md rounded-full bg-white shadow transition-transform"
              style={{ left: autoAssign ? 18 : 2 }}
            />
          </button>
        </div>

        <div>
          <label className="mb-xs text-body block font-medium text-gray-700">
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
          <label className="mb-xs text-body block font-medium text-gray-700">
            Default Cleaner Email
          </label>
          <input
            type="email"
            value={defaultCleanerEmail}
            onChange={(e) => setDefaultCleanerEmail(e.target.value)}
            className="px-sm py-base text-body w-full rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
      </div>

      <div className="p-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <h3 className="mb-sm text-body font-semibold text-gray-700">Checklist Templates</h3>
        <div className="space-y-base text-body text-gray-500">
          <div className="px-sm py-base flex items-center justify-between rounded-sm hover:bg-gray-50">
            <span>Standard Checkout Clean</span>
            <span className="text-body text-gray-400">12 items</span>
          </div>
          <div className="px-sm py-base flex items-center justify-between rounded-sm hover:bg-gray-50">
            <span>Deep Clean</span>
            <span className="text-body text-gray-400">18 items</span>
          </div>
          <div className="px-sm py-base flex items-center justify-between rounded-sm hover:bg-gray-50">
            <span>Quick Inspection</span>
            <span className="text-body text-gray-400">5 items</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="px-sm py-base text-body rounded-lg font-medium text-white"
        style={{ backgroundColor: "var(--strabb-secondary)" }}
      >
        Save Changes
      </button>
    </div>
  );
}
