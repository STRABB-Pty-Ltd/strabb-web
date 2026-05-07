"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

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

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function GeneralSection() {
  const addToast = useAppStore((s) => s.addToast);
  const [companyName, setCompanyName] = useState("STRABB Properties");
  const [timezone, setTimezone] = useState("Australia/Sydney");
  const [currency, setCurrency] = useState("AUD");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleSave = () => {
    // Settings persistence isn't wired to the API yet; surface that honestly
    // instead of pretending the save worked.
    addToast({ type: "warning", message: "Settings save is coming soon, not wired up yet" });
  };

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading text-highlight-10 font-semibold">General</h2>
        <p className="text-body text-highlight-10">Basic account and display settings.</p>
      </div>

      <div className="space-y-sm">
        <div>
          <label className="mb-xs text-body text-highlight-10 block font-medium">
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="px-sm py-base text-body w-full rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        <div>
          <label className="mb-xs text-body text-highlight-10 block font-medium">
            Default Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="px-sm py-base text-body w-full rounded-lg border"
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
          <label className="mb-xs text-body text-highlight-10 block font-medium">
            Default Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-sm py-base text-body w-full rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-xs text-body text-highlight-10 block font-medium">Appearance</label>
          <div
            className="p-xs inline-flex rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          >
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = mounted && theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className="gap-xs px-sm py-xs text-body flex items-center rounded-sm font-medium transition-colors"
                  style={{
                    backgroundColor: active ? "var(--strabb-secondary)" : "transparent",
                    color: active ? "var(--surface-60)" : "var(--highlight-10)",
                  }}
                  aria-pressed={active}
                >
                  <Icon size={14} />
                  {opt.label}
                </button>
              );
            })}
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
