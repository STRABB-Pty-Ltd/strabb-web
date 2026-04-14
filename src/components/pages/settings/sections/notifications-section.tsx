"use client";

import { useState } from "react";

import { useAppStore } from "@/stores/app-store";

interface NotificationToggle {
  id: string;
  label: string;
  description: string;
}

const toggles: NotificationToggle[] = [
  {
    id: "new_booking",
    label: "New Booking",
    description: "Email when a new booking is synced",
  },
  {
    id: "conflict",
    label: "Booking Conflict",
    description: "Email when overlapping bookings are detected",
  },
  {
    id: "cleaning_due",
    label: "Cleaning Due",
    description: "Email when a cleaning task is due within 24 hours",
  },
  {
    id: "sync_error",
    label: "Sync Error",
    description: "Email when an iCal sync fails",
  },
];

export function NotificationsSection() {
  const addToast = useAppStore((s) => s.addToast);
  const [settings, setSettings] = useState<Record<string, boolean>>({
    new_booking: true,
    conflict: true,
    cleaning_due: true,
    sync_error: true,
  });

  const toggle = (id: string) => {
    setSettings((s) => ({ ...s, [id]: !s[id] }));
  };

  const handleSave = () => {
    addToast({
      type: "success",
      message: "Notification preferences saved",
    });
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Notifications
        </h2>
        <p className="text-sm text-gray-500">
          Choose which email notifications you receive.
        </p>
      </div>

      <div className="space-y-3">
        {toggles.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div>
              <p className="text-sm font-medium text-gray-800">
                {t.label}
              </p>
              <p className="text-xs text-gray-500">{t.description}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(t.id)}
              className="relative h-6 w-10 rounded-full transition-colors"
              style={{
                backgroundColor: settings[t.id]
                  ? "var(--strabb-secondary)"
                  : "#D1D5DB",
              }}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{
                  left: settings[t.id] ? 18 : 2,
                }}
              />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--strabb-secondary)" }}
      >
        Save Preferences
      </button>
    </div>
  );
}
