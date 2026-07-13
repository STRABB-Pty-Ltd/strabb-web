"use client";

import { Button } from "@/components/ui/button";
import { useSettingsForm } from "@/lib/api-hooks/settings-api";

interface NotificationToggle {
  id: string;
  label: string;
  description: string;
}

const toggles: NotificationToggle[] = [
  {
    id: "newBooking",
    label: "New Booking",
    description: "Email when a new booking is synced",
  },
  {
    id: "conflict",
    label: "Booking Conflict",
    description: "Email when overlapping bookings are detected",
  },
  {
    id: "cleaningDue",
    label: "Cleaning Due",
    description: "Email when a cleaning task is due within 24 hours",
  },
  {
    id: "syncError",
    label: "Sync Error",
    description: "Email when an iCal sync fails",
  },
];

export function NotificationsSection() {
  const { values, patch, save, isSaving, dirty } = useSettingsForm<Record<string, boolean>>(
    "notifications",
    {
      newBooking: true,
      conflict: true,
      cleaningDue: true,
      syncError: true,
    },
  );

  const toggle = (id: string) => {
    patch({ [id]: !values[id] });
  };

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading text-highlight-10 font-semibold">Notifications</h2>
        <p className="text-body text-highlight-10">Choose which email notifications you receive.</p>
      </div>

      <div className="space-y-sm">
        {toggles.map((t) => {
          const labelId = `notify-${t.id}-label`;
          const checked = values[t.id] ?? false;
          return (
            <div
              key={t.id}
              className="px-sm py-sm flex items-center justify-between rounded-lg border"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <p id={labelId} className="text-body text-highlight-10 font-medium">
                  {t.label}
                </p>
                <p className="text-body text-highlight-10">{t.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-labelledby={labelId}
                onClick={() => toggle(t.id)}
                className="h-md relative w-lg rounded-full transition-colors outline-none before:absolute before:top-1/2 before:left-1/2 before:h-[var(--touch-target-min)] before:w-[var(--touch-target-min)] before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                style={{
                  backgroundColor: checked ? "var(--highlight-10)" : "var(--neutral-30)",
                }}
              >
                {/* Thumb 14x14 with locked left positions (2 / 18) gives symmetric 2px margins inside a w-lg (34px) track. */}
                <span
                  className="bg-surface-60 absolute top-[3px] h-[14px] w-[14px] rounded-full shadow transition-transform"
                  style={{ left: checked ? 18 : 2 }}
                />
              </button>
            </div>
          );
        })}
      </div>

      <Button type="button" onClick={save} disabled={!dirty || isSaving}>
        {isSaving ? "Saving…" : "Save Preferences"}
      </Button>
    </div>
  );
}
