"use client";

import { useAppStore } from "@/stores/app-store";

const channels = [
  { id: "airbnb", label: "Airbnb", color: "var(--channel-airbnb)" },
  { id: "booking_com", label: "Booking.com", color: "var(--channel-booking)" },
  { id: "vrbo", label: "VRBO", color: "var(--channel-vrbo)" },
  { id: "direct", label: "Direct", color: "var(--channel-direct)" },
];

export function ChannelFilter() {
  const activeChannels = useAppStore((s) => s.messaging.channels);
  const toggleChannel = useAppStore((s) => s.toggleChannel);

  return (
    <div className="border-b" style={{ padding: "var(--space-md)", borderColor: "var(--border)" }}>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
        Channels
      </h3>
      <div className="flex flex-col gap-1">
        {channels.map((ch) => {
          const isActive = activeChannels.length === 0 || activeChannels.includes(ch.id);
          return (
            <label key={ch.id} className="flex cursor-pointer items-center gap-2 py-1">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => toggleChannel(ch.id)}
                className="h-3.5 w-3.5 rounded border-gray-300"
              />
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: ch.color }}
              />
              <span className="text-sm text-gray-700">{ch.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
