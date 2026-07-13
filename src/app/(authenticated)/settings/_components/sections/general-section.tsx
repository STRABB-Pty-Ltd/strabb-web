"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useSettingsForm } from "@/lib/api-hooks/settings-api";

import { AccountSection } from "./account-section";
import { NotificationsSection } from "./notifications-section";
import { SystemHealthCard } from "./system-health-card";
import { TeamSection } from "./team-section";

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
  const { values, patch, save, isSaving, dirty } = useSettingsForm("general", {
    companyName: "STRABB Properties",
    timezone: "Australia/Sydney",
    currency: "AUD",
  });
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading text-highlight-10 font-semibold">General</h2>
        <p className="text-body text-highlight-10">Basic account and display settings.</p>
      </div>

      <div className="space-y-sm">
        <div>
          <label
            htmlFor="general-company-name"
            className="mb-xs text-body text-highlight-10 block font-medium"
          >
            Company Name
          </label>
          <Input
            id="general-company-name"
            type="text"
            value={values.companyName}
            onChange={(e) => patch({ companyName: e.target.value })}
          />
        </div>

        <div>
          <label
            htmlFor="general-timezone"
            className="mb-xs text-body text-highlight-10 block font-medium"
          >
            Default Timezone
          </label>
          <Select
            id="general-timezone"
            value={values.timezone}
            onChange={(e) => patch({ timezone: e.target.value })}
            options={timezones.map((tz) => ({ value: tz, label: tz }))}
          />
        </div>

        <div>
          <label
            htmlFor="general-currency"
            className="mb-xs text-body text-highlight-10 block font-medium"
          >
            Default Currency
          </label>
          <Select
            id="general-currency"
            value={values.currency}
            onChange={(e) => patch({ currency: e.target.value })}
            options={currencies.map((c) => ({ value: c, label: c }))}
          />
        </div>

        <div>
          <span
            id="general-appearance-label"
            className="mb-xs text-body text-highlight-10 block font-medium"
          >
            Appearance
          </span>
          <div
            role="group"
            aria-labelledby="general-appearance-label"
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
                    backgroundColor: active ? "var(--highlight-10)" : "transparent",
                    color: active ? "var(--surface-60)" : "var(--highlight-10)",
                  }}
                  aria-pressed={active}
                >
                  <Icon size={14} aria-hidden="true" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Button onClick={save} disabled={!dirty || isSaving}>
        {isSaving ? "Saving…" : "Save Changes"}
      </Button>

      <hr className="my-md" style={{ borderColor: "var(--border)" }} />
      <TeamSection />

      <hr className="my-md" style={{ borderColor: "var(--border)" }} />
      <NotificationsSection />

      <hr className="my-md" style={{ borderColor: "var(--border)" }} />
      <SystemHealthCard />

      <hr className="my-md" style={{ borderColor: "var(--border)" }} />
      <AccountSection />
    </div>
  );
}
