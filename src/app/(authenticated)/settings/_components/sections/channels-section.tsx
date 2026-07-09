"use client";

import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle,
  CircleDashed,
  CircleSlash,
  Loader,
  type LucideIcon,
} from "lucide-react";

import { useSyncLogs, useTriggerSync } from "@/hooks/use-sync";
import { ApiError } from "@/lib/api-client";
import { useListingsChannels } from "@/lib/api-hooks/listings-api";
import { useSettingsForm } from "@/lib/api-hooks/settings-api";
import type { ChannelSummaryResponse } from "@/lib/schemas/listing";
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

// Rollup status for a channel (GET /listings/channels), distinct from the
// per-listing sync-log status set above.
const channelStatusColors: Record<ChannelSummaryResponse["status"], string> = {
  connected: "var(--status-completed)",
  pending: "var(--status-issues)",
  error: "var(--status-danger)",
  not_connected: "var(--neutral-30)",
};

const channelStatusFgColors: Record<ChannelSummaryResponse["status"], string> = {
  connected: "var(--status-success-fg)",
  pending: "var(--status-danger-fg)",
  error: "var(--status-danger-fg)",
  not_connected: "var(--text-secondary)",
};

const channelStatusIcons: Record<ChannelSummaryResponse["status"], LucideIcon> = {
  connected: CheckCircle,
  pending: CircleDashed,
  error: AlertCircle,
  not_connected: CircleSlash,
};

const channelStatusLabels: Record<ChannelSummaryResponse["status"], string> = {
  connected: "Connected",
  pending: "Pending",
  error: "Error",
  not_connected: "Not connected",
};

// Colour stripe per channel id - the API doesn't carry a colour, only
// identity/status, so this stays a local display-only lookup.
const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

// GET /listings/channels also returns "email" and "internal_notes" (message
// source channels reused from the same backend display map) - never real
// OTAs, so they're excluded from sync-frequency/pricing-rule configuration.
const BOOKABLE_CHANNEL_IDS = new Set(["airbnb", "booking_com", "vrbo", "direct"]);

interface ChannelPrefs {
  syncFrequency: string;
  pricingRule: string;
}

const DEFAULT_CHANNEL_PREFS: ChannelPrefs = { syncFrequency: "15", pricingRule: "base" };

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
  const { data: channels, isLoading: channelsLoading } = useListingsChannels();

  // Keyed by channel id rather than a stored array: the channel set itself
  // now comes live from GET /listings/channels, so only the per-channel
  // prefs (not identity/colour/status) are persisted.
  const { values, patch, save, isSaving, dirty } = useSettingsForm<{
    channels: Record<string, ChannelPrefs>;
  }>("channels", { channels: {} });

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
      channels: {
        ...current.channels,
        [id]: { ...(current.channels[id] ?? DEFAULT_CHANNEL_PREFS), [field]: value },
      },
    }));
  };

  const bookableChannels = (channels ?? []).filter((c) => BOOKABLE_CHANNEL_IDS.has(c.id));

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
        {channelsLoading ? (
          <p className="text-body" style={{ color: "var(--text-secondary)" }}>
            Loading channels...
          </p>
        ) : bookableChannels.length === 0 ? (
          <p className="text-body" style={{ color: "var(--text-secondary)" }}>
            No channels found.
          </p>
        ) : (
          bookableChannels.map((ch) => {
            const prefs = values.channels[ch.id] ?? DEFAULT_CHANNEL_PREFS;
            const StatusIcon = channelStatusIcons[ch.status];
            return (
              <div
                key={ch.id}
                className="px-sm py-sm rounded-lg border"
                style={{
                  backgroundColor: "var(--neutral-30)",
                  borderColor: "var(--border)",
                  borderLeftWidth: "var(--stripe-width)",
                  borderLeftColor: channelColors[ch.id] ?? "var(--border)",
                }}
              >
                <div className="mb-sm gap-base flex items-center justify-between">
                  <div className="gap-base flex items-center">
                    <h3 className="text-body text-highlight-10 font-semibold">{ch.name}</h3>
                    <span
                      className="gap-xs px-base py-xs text-body inline-flex items-center rounded-md font-medium"
                      style={{
                        backgroundColor: channelStatusColors[ch.status],
                        color: channelStatusFgColors[ch.status],
                      }}
                    >
                      <StatusIcon size={12} aria-hidden="true" />
                      {channelStatusLabels[ch.status]}
                    </span>
                  </div>
                  <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                    {ch.listingCount === 0
                      ? "No listings mapped"
                      : `${ch.listingCount} listing${ch.listingCount === 1 ? "" : "s"} mapped`}
                  </p>
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
                      value={prefs.syncFrequency}
                      onChange={(e) => updateChannel(ch.id, "syncFrequency", e.target.value)}
                      className="px-sm py-base text-body w-full rounded-sm border"
                      style={{
                        backgroundColor: "var(--surface-60)",
                        borderColor: "var(--border)",
                      }}
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
                      value={prefs.pricingRule}
                      onChange={(e) => updateChannel(ch.id, "pricingRule", e.target.value)}
                      className="px-sm py-base text-body w-full rounded-sm border"
                      style={{
                        backgroundColor: "var(--surface-60)",
                        borderColor: "var(--border)",
                      }}
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
            );
          })
        )}
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
