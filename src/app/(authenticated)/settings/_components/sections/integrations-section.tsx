"use client";

import { useState } from "react";

import { useAppStore } from "@/stores/app-store";

interface Platform {
  id: string;
  name: string;
  logo: string;
  color: string;
  connected: boolean;
  lastSync: string | null;
  listingCount: number;
}

const mockPlatforms: Platform[] = [
  {
    id: "airbnb",
    name: "Airbnb",
    logo: "A",
    color: "var(--channel-airbnb)",
    connected: true,
    lastSync: "2026-04-14 09:30",
    listingCount: 4,
  },
  {
    id: "booking_com",
    name: "Booking.com",
    logo: "B",
    color: "var(--channel-booking)",
    connected: true,
    lastSync: "2026-04-14 09:25",
    listingCount: 3,
  },
  {
    id: "vrbo",
    name: "VRBO",
    logo: "V",
    color: "var(--channel-vrbo)",
    connected: false,
    lastSync: null,
    listingCount: 0,
  },
];

export function IntegrationsSection() {
  const addToast = useAppStore((s) => s.addToast);
  const [icalUrl, setIcalUrl] = useState("");

  const handleConnect = (name: string) => {
    addToast({
      type: "info",
      message: `${name} connection - feature coming soon`,
    });
  };

  const handleAddIcal = () => {
    if (!icalUrl.trim()) return;
    addToast({ type: "warning", message: "iCal feed save is coming soon, not wired up yet" });
    setIcalUrl("");
  };

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading font-semibold text-gray-900">Integrations</h2>
        <p className="text-body text-gray-500">Connect platforms and manage sync settings.</p>
      </div>

      <div className="space-y-sm">
        {mockPlatforms.map((platform) => (
          <div
            key={platform.id}
            className="gap-sm px-sm py-sm flex items-center rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="h-lg text-subheading text-text-on-color flex w-lg items-center justify-center rounded-lg font-bold"
              style={{ backgroundColor: platform.color }}
            >
              {platform.logo}
            </div>
            <div className="flex-1">
              <p className="text-body font-medium text-gray-800">{platform.name}</p>
              {platform.connected ? (
                <p className="text-body text-gray-500">
                  Last sync: {platform.lastSync} &middot; {platform.listingCount} listings
                </p>
              ) : (
                <p className="text-body text-gray-400">Not connected</p>
              )}
            </div>
            <div className="gap-base flex items-center">
              {platform.connected && (
                <span
                  className="px-base py-xs text-body rounded-md font-medium"
                  style={{
                    backgroundColor: "var(--status-success-tint)",
                    color: "var(--status-success)",
                  }}
                >
                  Connected
                </span>
              )}
              <button
                type="button"
                onClick={() => handleConnect(platform.name)}
                className="px-sm py-xs text-body rounded-lg border font-medium"
                style={{
                  borderColor: "var(--border)",
                  color: platform.connected ? "var(--status-danger)" : "var(--strabb-secondary)",
                }}
              >
                {platform.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <h3 className="mb-sm text-body font-semibold text-gray-700">Manual iCal Feed</h3>
        <div className="gap-base flex">
          <input
            type="url"
            value={icalUrl}
            onChange={(e) => setIcalUrl(e.target.value)}
            placeholder="https://example.com/calendar.ics"
            className="px-sm py-base text-body flex-1 rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          />
          <button
            type="button"
            onClick={handleAddIcal}
            className="px-sm py-base text-body rounded-lg font-medium text-white"
            style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
          >
            Add Feed
          </button>
        </div>
      </div>
    </div>
  );
}
