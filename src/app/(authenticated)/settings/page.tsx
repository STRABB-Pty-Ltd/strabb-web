"use client";

import { CreditCardIcon, ExternalLinkIcon, RocketIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import {
  useBillingStatus,
  useCreateCheckout,
  useCreatePortal,
  useStartTrial,
} from "@/hooks/use-billing";
import { BILLING_STATUS_COLORS, BILLING_STATUS_LABELS } from "@/lib/schemas/billing";

export default function SettingsPage() {
  const { data, isLoading } = useBillingStatus();
  const startTrial = useStartTrial();
  const createCheckout = useCreateCheckout();
  const createPortal = useCreatePortal();

  const subscription = data?.subscription;
  const status = subscription?.status;

  async function handleUpgrade() {
    const url = await createCheckout.mutateAsync();
    window.location.href = url;
  }

  async function handleManageBilling() {
    const url = await createPortal.mutateAsync();
    window.location.href = url;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account and billing." />

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {data && (
        <div className="max-w-lg space-y-6">
          <div className="rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-medium">Subscription</h2>

            {!subscription && (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  No active subscription. Start a 14-day free trial to get started.
                </p>
                <Button onClick={() => startTrial.mutate()} disabled={startTrial.isPending}>
                  <RocketIcon data-icon="inline-start" />
                  {startTrial.isPending ? "Starting..." : "Start free trial"}
                </Button>
              </div>
            )}

            {subscription && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <p className={`font-medium ${BILLING_STATUS_COLORS[status ?? ""] ?? ""}`}>
                      {BILLING_STATUS_LABELS[status ?? ""] ?? status}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Active listings</p>
                    <p className="font-medium">{data.billableListingCount}</p>
                  </div>
                </div>

                {status === "trial" && subscription.trialEndsAt && (
                  <div>
                    <p className="text-muted-foreground text-xs">Trial ends</p>
                    <p className="text-sm">
                      {new Date(subscription.trialEndsAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {subscription.currentPeriodEnd && (
                  <div>
                    <p className="text-muted-foreground text-xs">Current period ends</p>
                    <p className="text-sm">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {status === "past_due" && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Payment failed
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Please update your payment method to continue using STRABB.
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {(status === "trial" || status === "cancelled" || status === "past_due") && (
                    <Button onClick={handleUpgrade} disabled={createCheckout.isPending}>
                      <CreditCardIcon data-icon="inline-start" />
                      {createCheckout.isPending ? "Loading..." : "Upgrade"}
                    </Button>
                  )}
                  {subscription.stripeSubscriptionId && (
                    <Button
                      variant="outline"
                      onClick={handleManageBilling}
                      disabled={createPortal.isPending}
                    >
                      <ExternalLinkIcon data-icon="inline-start" />
                      {createPortal.isPending ? "Loading..." : "Manage billing"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
