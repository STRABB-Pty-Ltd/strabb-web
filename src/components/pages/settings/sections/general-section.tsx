"use client";

import { useState } from "react";

import { useAppStore } from "@/stores/app-store";

const timezones = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "Pacific/Auckland",
  "UTC",
];

const currencies = ["AUD", "NZD", "USD", "EUR", "GBP"];

export function GeneralSection() {
  const addToast = useAppStore((s) => s.addToast);
  const [companyName, setCompanyName] = useState("STRABB Properties");
  const [timezone, setTimezone] = useState("Australia/Sydney");
  const [currency, setCurrency] = useState("AUD");

  const handleSave = () => {
    addToast({ type: "success", message: "General settings saved" });
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">General</h2>
        <p className="text-sm text-gray-500">
          Basic account and display settings.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Default Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Default Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
