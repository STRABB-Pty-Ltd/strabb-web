"use client";

import { differenceInCalendarDays, format } from "date-fns";

import {
  useBillingStatus,
  useCreateCheckout,
  useCreatePortal,
  useStartTrial,
} from "@/hooks/use-billing";
import { ApiError } from "@/lib/api-client";
import {
  BILLING_STATUS_COLORS,
  BILLING_STATUS_LABELS,
  type SubscriptionResponse,
} from "@/lib/schemas/billing";
import { useAppStore } from "@/stores/app-store";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return format(new Date(value), "d MMM yyyy");
}

function trialDaysLeft(sub: SubscriptionResponse): number | null {
  if (!sub.trialEndsAt) return null;
  return differenceInCalendarDays(new Date(sub.trialEndsAt), new Date());
}

function statusToneClass(status: string | undefined): string {
  if (!status) return BILLING_STATUS_COLORS.cancelled;
  return BILLING_STATUS_COLORS[status] ?? "text-highlight-10";
}

function statusLabel(status: string | undefined): string {
  if (!status) return "No subscription";
  return BILLING_STATUS_LABELS[status] ?? status;
}

export function BillingSection() {
  const { data, isLoading } = useBillingStatus();
  const startTrial = useStartTrial();
  const createCheckout = useCreateCheckout();
  const createPortal = useCreatePortal();
  const addToast = useAppStore((s) => s.addToast);

  const handleError = (err: unknown) => {
    const message =
      err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Something went wrong";
    addToast({ type: "error", message });
  };

  const handleStartTrial = () => {
    startTrial.mutate(undefined, {
      onSuccess: () => addToast({ type: "success", message: "Free trial started" }),
      onError: handleError,
    });
  };

  const handleCheckout = () => {
    createCheckout.mutate(undefined, {
      onSuccess: (url) => {
        window.location.href = url;
      },
      onError: handleError,
    });
  };

  const handlePortal = () => {
    createPortal.mutate(undefined, {
      onSuccess: (url) => {
        window.location.href = url;
      },
      onError: handleError,
    });
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-md">
        <div>
          <h2 className="text-subheading font-semibold text-highlight-10">Billing</h2>
          <p className="text-body text-highlight-10">Manage your subscription and payment details.</p>
        </div>
        <p className="text-body text-highlight-10">Loading…</p>
      </div>
    );
  }

  const sub = data.subscription;
  const status = sub?.status;
  const daysLeft = sub ? trialDaysLeft(sub) : null;

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading font-semibold text-highlight-10">Billing</h2>
        <p className="text-body text-highlight-10">Manage your subscription and payment details.</p>
      </div>

      <div className="p-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <div className="mb-sm flex items-center justify-between">
          <div>
            <p className="text-body font-medium text-highlight-10">Current plan</p>
            <p className={`text-body font-semibold ${statusToneClass(status)}`}>
              {statusLabel(status)}
            </p>
          </div>
          {status === "trial" && daysLeft !== null && daysLeft >= 0 && (
            <span
              className="px-sm py-xs text-body rounded-md font-medium"
              style={{
                backgroundColor: daysLeft <= 3 ? "var(--status-warning-tint)" : "var(--neutral-30)",
                color: daysLeft <= 3 ? "var(--status-warning)" : "var(--highlight-10)",
              }}
            >
              {daysLeft === 0
                ? "Ends today"
                : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
            </span>
          )}
        </div>

        <div className="mb-sm gap-sm grid grid-cols-2">
          <div>
            <p className="text-body text-highlight-10">Billable listings</p>
            <p className="font-data text-subheading font-semibold text-highlight-10">
              {data.billableListingCount}
            </p>
          </div>
          {sub && (
            <div>
              <p className="text-body text-highlight-10">
                {status === "trial" ? "Trial ends" : "Next billing date"}
              </p>
              <p className="text-body text-highlight-10">
                {formatDate(status === "trial" ? sub.trialEndsAt : sub.currentPeriodEnd)}
              </p>
            </div>
          )}
        </div>

        <div className="gap-xs flex flex-wrap">
          {!sub && (
            <button
              type="button"
              onClick={handleStartTrial}
              disabled={startTrial.isPending}
              className="px-sm py-base text-body rounded-lg font-medium text-surface-60 disabled:opacity-60"
              style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
            >
              {startTrial.isPending ? "Starting…" : "Start free trial"}
            </button>
          )}

          {sub && status === "trial" && (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={createCheckout.isPending}
              className="px-sm py-base text-body rounded-lg font-medium text-surface-60 disabled:opacity-60"
              style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
            >
              {createCheckout.isPending ? "Redirecting…" : "Add payment details"}
            </button>
          )}

          {sub && (status === "active" || status === "past_due") && (
            <button
              type="button"
              onClick={handlePortal}
              disabled={createPortal.isPending}
              className="px-sm py-base text-body rounded-lg font-medium text-surface-60 disabled:opacity-60"
              style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
            >
              {createPortal.isPending ? "Redirecting…" : "Manage subscription"}
            </button>
          )}

          {sub && status === "cancelled" && (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={createCheckout.isPending}
              className="px-sm py-base text-body rounded-lg font-medium text-surface-60 disabled:opacity-60"
              style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
            >
              {createCheckout.isPending ? "Redirecting…" : "Reactivate subscription"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
