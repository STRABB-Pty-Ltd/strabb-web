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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-500">Connect platforms and manage sync settings.</p>
      </div>

      <div className="space-y-3">
        {mockPlatforms.map((platform) => (
          <div
            key={platform.id}
            className="flex items-center gap-4 rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white"
              style={{ backgroundColor: platform.color }}
            >
              {platform.logo}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{platform.name}</p>
              {platform.connected ? (
                <p className="text-xs text-gray-500">
                  Last sync: {platform.lastSync} &middot; {platform.listingCount} listings
                </p>
              ) : (
                <p className="text-xs text-gray-400">Not connected</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {platform.connected && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
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
                className="rounded-lg border px-3 py-1.5 text-xs font-medium"
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

      <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)" }}>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Manual iCal Feed</h3>
        <div className="flex gap-2">
          <input
            type="url"
            value={icalUrl}
            onChange={(e) => setIcalUrl(e.target.value)}
            placeholder="https://example.com/calendar.ics"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
          <button
            type="button"
            onClick={handleAddIcal}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--strabb-secondary)" }}
          >
            Add Feed
          </button>
        </div>
      </div>
    </div>
  );
}
