"use client";

import { differenceInCalendarDays, format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  useBillingStatus,
  useCreateCheckout,
  useCreatePortal,
  useStartTrial,
} from "@/hooks/use-billing";
import { useCurrentUser } from "@/hooks/use-current-user";
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
  const { role } = useCurrentUser();
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

  // Defence in depth: billing is an owner/admin surface. Settings is already
  // blocked for cleaners by middleware + nav hiding, and the API returns 403 on
  // /billing/*, but guard here too so billing controls never render for a
  // non-owner role even if they somehow reach this section.
  if (role !== null && role !== "owner" && role !== "admin") {
    return null;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-md">
        <div>
          <h2 className="text-subheading text-highlight-10 font-semibold">Billing</h2>
          <p className="text-body text-highlight-10">
            Manage your subscription and payment details.
          </p>
        </div>
        <p
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="text-body text-highlight-10"
        >
          Loading…
        </p>
      </div>
    );
  }

  const sub = data.subscription;
  const status = sub?.status;
  const daysLeft = sub ? trialDaysLeft(sub) : null;

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading text-highlight-10 font-semibold">Billing</h2>
        <p className="text-body text-highlight-10">Manage your subscription and payment details.</p>
      </div>

      <div className="p-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <div className="mb-sm flex items-center justify-between">
          <div>
            <p className="text-body text-highlight-10 font-medium">Current plan</p>
            <p className={`text-body font-semibold ${statusToneClass(status)}`}>
              {statusLabel(status)}
            </p>
          </div>
          {status === "trial" && daysLeft !== null && daysLeft >= 0 && (
            <Chip
              tone={daysLeft <= 3 ? "tint" : "neutral"}
              color={daysLeft <= 3 ? "var(--status-warning)" : undefined}
              size="md"
              radius="md"
            >
              {daysLeft === 0
                ? "Ends today"
                : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
            </Chip>
          )}
        </div>

        <div className="mb-sm gap-sm grid grid-cols-1 md:grid-cols-2">
          <div>
            <p className="text-body text-highlight-10">Billable listings</p>
            <p className="font-data text-subheading text-highlight-10 font-semibold">
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
            <Button type="button" onClick={handleStartTrial} disabled={startTrial.isPending}>
              {startTrial.isPending ? "Starting…" : "Start free trial"}
            </Button>
          )}

          {sub && status === "trial" && (
            <Button type="button" onClick={handleCheckout} disabled={createCheckout.isPending}>
              {createCheckout.isPending ? "Redirecting…" : "Add payment details"}
            </Button>
          )}

          {sub && (status === "active" || status === "past_due") && (
            <Button type="button" onClick={handlePortal} disabled={createPortal.isPending}>
              {createPortal.isPending ? "Redirecting…" : "Manage subscription"}
            </Button>
          )}

          {sub && status === "cancelled" && (
            <Button type="button" onClick={handleCheckout} disabled={createCheckout.isPending}>
              {createCheckout.isPending ? "Redirecting…" : "Reactivate subscription"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
