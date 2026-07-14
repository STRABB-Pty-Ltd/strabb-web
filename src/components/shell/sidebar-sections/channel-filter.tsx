"use client";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

const channels = [
  { id: "airbnb", label: "Airbnb", color: "var(--channel-airbnb)" },
  { id: "booking_com", label: "Booking.com", color: "var(--channel-booking)" },
  { id: "vrbo", label: "VRBO", color: "var(--channel-vrbo)" },
  { id: "direct", label: "Direct", color: "var(--channel-direct)" },
  { id: "ota", label: "OTA", color: "var(--channel-ota)" },
];

export function ChannelFilter() {
  const activeChannels = useAppStore((s) => s.messaging.channels);
  const toggleChannel = useAppStore((s) => s.toggleChannel);

  return (
    <div className="p-sm">
      <h3
        className="mb-base text-body font-semibold tracking-wide uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        Channels
      </h3>
      <div className="gap-xs flex flex-col">
        {channels.map((ch) => {
          const isActive = activeChannels.includes(ch.id);
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => toggleChannel(ch.id)}
              aria-pressed={isActive}
              className={cn(
                "gap-base px-sm py-base flex cursor-pointer items-center rounded-lg text-left",
                isActive ? "bg-highlight-10 text-surface-60" : "bg-neutral-30 text-highlight-10",
              )}
            >
              <span
                className="h-sm w-sm shrink-0 rounded-sm"
                style={{ backgroundColor: ch.color }}
              />
              <span className="text-body font-medium">{ch.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
