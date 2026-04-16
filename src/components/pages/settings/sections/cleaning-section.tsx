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
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Cleaning</h2>
        <p className="text-sm text-gray-500">Default cleaning task configuration.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Default Duration (hours)
          </label>
          <input
            type="number"
            value={defaultDuration}
            onChange={(e) => setDefaultDuration(e.target.value)}
            min="0.5"
            step="0.5"
            className="w-32 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        <div
          className="flex items-center justify-between rounded-lg border px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <p className="text-sm font-medium text-gray-800">Auto-assign Tasks</p>
            <p className="text-xs text-gray-500">
              Automatically assign cleaning tasks to the default cleaner
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoAssign(!autoAssign)}
            className="relative h-6 w-10 rounded-full transition-colors"
            style={{
              backgroundColor: autoAssign ? "var(--strabb-secondary)" : "#D1D5DB",
            }}
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
              style={{ left: autoAssign ? 18 : 2 }}
            />
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Default Cleaner Name
          </label>
          <input
            type="text"
            value={defaultCleaner}
            onChange={(e) => setDefaultCleaner(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Default Cleaner Email
          </label>
          <input
            type="email"
            value={defaultCleanerEmail}
            onChange={(e) => setDefaultCleanerEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
      </div>

      <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)" }}>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Checklist Templates</h3>
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center justify-between rounded px-3 py-2 hover:bg-gray-50">
            <span>Standard Checkout Clean</span>
            <span className="text-xs text-gray-400">12 items</span>
          </div>
          <div className="flex items-center justify-between rounded px-3 py-2 hover:bg-gray-50">
            <span>Deep Clean</span>
            <span className="text-xs text-gray-400">18 items</span>
          </div>
          <div className="flex items-center justify-between rounded px-3 py-2 hover:bg-gray-50">
            <span>Quick Inspection</span>
            <span className="text-xs text-gray-400">5 items</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--strabb-secondary)" }}
      >
        Save Changes
      </button>
    </div>
  );
}
