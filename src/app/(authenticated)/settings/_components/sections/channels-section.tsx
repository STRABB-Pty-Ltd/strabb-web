"use client";

import { format } from "date-fns";
import { AlertCircle, CheckCircle, CircleDashed, Loader, type LucideIcon } from "lucide-react";

import { useSyncLogs, useTriggerSync } from "@/hooks/use-sync";
import { ApiError } from "@/lib/api-client";
import { useSettingsForm } from "@/lib/api-hooks/settings-api";
import { useAppStore } from "@/stores/app-store";

// Same status set as the Sync Logs page (strabb-api PR #3 shared primitives):
// synced | failed | in_progress | skipped.
const statusColors: Record<string, string> = {
  synced: "var(--status-completed)",
  skipped: "var(--status-issues)",
  failed: "var(--status-danger)",
  in_progress: "var(--status-in-progress)",
};

const statusFgColors: Record<string, string> = {
  synced: "var(--status-success-fg)",
  skipped: "var(--status-danger-fg)",
  failed: "var(--status-danger-fg)",
  in_progress: "var(--status-success-fg)",
};

const statusIcons: Record<string, LucideIcon> = {
  synced: CheckCircle,
  skipped: CircleDashed,
  failed: AlertCircle,
  in_progress: Loader,
};

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
  // Persisting the whole channel array (static id/name/colour included) means a
  // saved user won't pick up channels later added to `mockChannels` - acceptable
  // for v1; revisit with a merge-by-id if the channel set becomes dynamic.
  const { values, patch, save, isSaving, dirty } = useSettingsForm<{ channels: ChannelConfig[] }>(
    "channels",
    { channels: mockChannels },
  );

  // Real Channex sync status, sourced the same way as the Sync Logs page.
  // Channex does not expose a per-OTA (Airbnb/Booking.com/VRBO) sync
  // breakdown - only a single channel-manager-wide sync run - so this shows
  // the most recent run, not one row per channel below.
  const { data: logsData, isLoading: logsLoading } = useSyncLogs(1, 1);
  const trigger = useTriggerSync();
  const addToast = useAppStore((s) => s.addToast);
  const lastLog = logsData?.data[0];

  const handleTriggerSync = () => {
    trigger.mutate(undefined, {
      onSuccess: (result) => {
        addToast({
          type: "success",
          message: `Sync complete - ${result.listingsSynced} listings, ${result.bookingsCreated} new bookings, ${result.conflictsDetected} conflicts.`,
        });
      },
      onError: (err: unknown) => {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to trigger sync";
        addToast({ type: "error", message });
      },
    });
  };

  const updateChannel = (id: string, field: "syncFrequency" | "pricingRule", value: string) => {
    patch((current) => ({
      channels: current.channels.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }));
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

      <div
        className="px-sm py-sm gap-base flex items-center justify-between rounded-lg border"
        style={{ backgroundColor: "var(--neutral-30)", borderColor: "var(--border)" }}
      >
        <div className="gap-sm flex items-center">
          {!logsLoading && lastLog
            ? (() => {
                const StatusIcon = statusIcons[lastLog.status] ?? CircleDashed;
                return (
                  <span
                    className="gap-xs px-base py-xs text-body inline-flex items-center rounded-md font-medium"
                    style={{
                      backgroundColor: statusColors[lastLog.status] ?? "var(--neutral-30)",
                      color: statusFgColors[lastLog.status] ?? "var(--text-secondary)",
                    }}
                  >
                    <StatusIcon size={12} aria-hidden="true" />
                    {lastLog.status}
                  </span>
                );
              })()
            : null}
          <p className="text-body" style={{ color: "var(--text-secondary)" }}>
            {logsLoading
              ? "Loading last sync..."
              : lastLog
                ? `Last Channex sync ${format(new Date(lastLog.startedAt), "d MMM yyyy, HH:mm:ss")}`
                : "No sync runs recorded yet"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleTriggerSync}
          disabled={trigger.isPending}
          title="Limited to 3 syncs per 5 minutes"
          className="px-sm py-base text-body rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: "var(--surface-60)", color: "var(--highlight-10)" }}
        >
          {trigger.isPending ? "Syncing..." : "Sync Now"}
        </button>
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
