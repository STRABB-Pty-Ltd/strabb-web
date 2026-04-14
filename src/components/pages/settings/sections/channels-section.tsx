"use client";

import { useState } from "react";

import { useAppStore } from "@/stores/app-store";

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
  const addToast = useAppStore((s) => s.addToast);
  const [channels, setChannels] = useState(mockChannels);

  const updateChannel = (
    id: string,
    field: "syncFrequency" | "pricingRule",
    value: string,
  ) => {
    setChannels((ch) =>
      ch.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const handleSave = () => {
    addToast({ type: "success", message: "Channel settings saved" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Channels</h2>
        <p className="text-sm text-gray-500">
          Per-platform sync and pricing settings.
        </p>
      </div>

      <div className="space-y-3">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="rounded-lg border px-4 py-4"
            style={{
              borderColor: "var(--border)",
              borderLeftWidth: 4,
              borderLeftColor: ch.color,
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-800">
                {ch.name}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Sync Frequency
                </label>
                <select
                  value={ch.syncFrequency}
                  onChange={(e) =>
                    updateChannel(ch.id, "syncFrequency", e.target.value)
                  }
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)" }}
                >
                  {syncOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Default Pricing Rule
                </label>
                <select
                  value={ch.pricingRule}
                  onChange={(e) =>
                    updateChannel(ch.id, "pricingRule", e.target.value)
                  }
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)" }}
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
        onClick={handleSave}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--strabb-secondary)" }}
      >
        Save Changes
      </button>
    </div>
  );
}
