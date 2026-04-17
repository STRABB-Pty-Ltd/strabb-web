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
    <div style={{ padding: "var(--space-md)" }}>
      <h3
        className="mb-2 text-xs font-semibold tracking-wide uppercase"
        style={{ color: "var(--brand-10)", opacity: 0.7 }}
      >
        Channels
      </h3>
      <div className="flex flex-col gap-1">
        {channels.map((ch) => {
          const isActive = activeChannels.length === 0 || activeChannels.includes(ch.id);
          return (
            <label
              key={ch.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5"
              style={{
                backgroundColor: isActive ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
                color: isActive ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => toggleChannel(ch.id)}
                className="h-3.5 w-3.5"
                style={{ accentColor: "var(--brand-10)" }}
              />
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: ch.color }} />
              <span className="text-sm">{ch.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
