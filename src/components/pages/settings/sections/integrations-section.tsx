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
      message: `${name} connection — feature coming soon`,
    });
  };

  const handleAddIcal = () => {
    if (!icalUrl.trim()) return;
    addToast({ type: "success", message: "iCal feed added" });
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
            className="flex items-center gap-sm rounded-lg border px-sm py-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="flex h-lg w-lg items-center justify-center rounded-lg text-subheading font-bold text-white"
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
            <div className="flex items-center gap-base">
              {platform.connected && (
                <span
                  className="rounded-full px-base py-xs text-body font-medium"
                  style={{
                    backgroundColor: "rgba(22, 163, 74, 0.1)",
                    color: "#16A34A",
                  }}
                >
                  Connected
                </span>
              )}
              <button
                type="button"
                onClick={() => handleConnect(platform.name)}
                className="rounded-lg border px-sm py-xs text-body font-medium"
                style={{
                  borderColor: "var(--border)",
                  color: platform.connected ? "#DC2626" : "var(--strabb-secondary)",
                }}
              >
                {platform.connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-sm" style={{ borderColor: "var(--border)" }}>
        <h3 className="mb-sm text-body font-semibold text-gray-700">Manual iCal Feed</h3>
        <div className="flex gap-base">
          <input
            type="url"
            value={icalUrl}
            onChange={(e) => setIcalUrl(e.target.value)}
            placeholder="https://example.com/calendar.ics"
            className="flex-1 rounded-lg border px-sm py-base text-body"
            style={{ borderColor: "var(--border)" }}
          />
          <button
            type="button"
            onClick={handleAddIcal}
            className="rounded-lg px-sm py-base text-body font-medium text-white"
            style={{ backgroundColor: "var(--strabb-secondary)" }}
          >
            Add Feed
          </button>
        </div>
      </div>
    </div>
  );
}
