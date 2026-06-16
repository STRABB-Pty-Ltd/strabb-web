"use client";

import { useSettingsForm } from "@/lib/api-hooks/settings-api";

interface ChannelConfig {
  id: string;
  name: string;
  color: string;
  syncFrequency: string;
  pricingRule: string;
}

const mockChannels: ChannelConfig[] = [
  {
    id: "airbnb",
    name: "Airbnb",
    color: "var(--channel-airbnb)",
    syncFrequency: "15",
    pricingRule: "base",
  },
  {
    id: "booking_com",
    name: "Booking.com",
    color: "var(--channel-booking)",
    syncFrequency: "15",
    pricingRule: "base",
  },
  {
    id: "vrbo",
    name: "VRBO",
    color: "var(--channel-vrbo)",
    syncFrequency: "30",
    pricingRule: "base_plus_10",
  },
  {
    id: "direct",
    name: "Direct",
    color: "var(--channel-direct)",
    syncFrequency: "60",
    pricingRule: "discount_5",
  },
];

const syncOptions = [
  { value: "5", label: "Every 5 minutes" },
  { value: "15", label: "Every 15 minutes" },
  { value: "30", label: "Every 30 minutes" },
  { value: "60", label: "Every hour" },
];

const pricingOptions = [
  { value: "base", label: "Base rate" },
  { value: "base_plus_10", label: "Base +10%" },
  { value: "base_plus_20", label: "Base +20%" },
  { value: "discount_5", label: "Base -5%" },
  { value: "discount_10", label: "Base -10%" },
];

export function ChannelsSection() {
  const { values, patch, save, isSaving, dirty } = useSettingsForm<{ channels: ChannelConfig[] }>(
    "channels",
    { channels: mockChannels },
  );

  const updateChannel = (id: string, field: "syncFrequency" | "pricingRule", value: string) => {
    patch({
      channels: values.channels.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    });
  };

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading text-highlight-10 font-semibold">Channel sync</h2>
        <p className="text-body text-highlight-10">
          How often each OTA polls and what pricing rule it inherits. Channel manager and other
          third-party software connections live under Integrations.
        </p>
      </div>

      <div className="space-y-sm">
        {values.channels.map((ch) => (
          <div
            key={ch.id}
            className="px-sm py-sm rounded-lg border"
            style={{
              backgroundColor: "var(--neutral-30)",
              borderColor: "var(--border)",
              borderLeftWidth: "var(--stripe-width)",
              borderLeftColor: ch.color,
            }}
          >
            <div className="mb-sm gap-base flex items-center">
              <h3 className="text-body text-highlight-10 font-semibold">{ch.name}</h3>
            </div>
            <div className="gap-sm grid grid-cols-2">
              <div>
                <label
                  htmlFor={`channel-${ch.id}-sync`}
                  className="mb-xs text-body text-highlight-10 block font-medium"
                >
                  Sync Frequency
                </label>
                <select
                  id={`channel-${ch.id}-sync`}
                  value={ch.syncFrequency}
                  onChange={(e) => updateChannel(ch.id, "syncFrequency", e.target.value)}
                  className="px-sm py-base text-body w-full rounded-sm border"
                  style={{ backgroundColor: "var(--surface-60)", borderColor: "var(--border)" }}
                >
                  {syncOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor={`channel-${ch.id}-pricing`}
                  className="mb-xs text-body text-highlight-10 block font-medium"
                >
                  Default Pricing Rule
                </label>
                <select
                  id={`channel-${ch.id}-pricing`}
                  value={ch.pricingRule}
                  onChange={(e) => updateChannel(ch.id, "pricingRule", e.target.value)}
                  className="px-sm py-base text-body w-full rounded-sm border"
                  style={{ backgroundColor: "var(--surface-60)", borderColor: "var(--border)" }}
                >
                  {pricingOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={!dirty || isSaving}
        className="px-sm py-base text-body text-surface-60 rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
      >
        {isSaving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
