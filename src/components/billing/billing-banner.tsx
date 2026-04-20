"use client";

import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";

import { useBillingStatus } from "@/hooks/use-billing";

export function BillingBanner() {
  const { data } = useBillingStatus();

  if (!data) return null;
  if (data.hasActiveSubscription) return null;

  const status = data.subscription?.status;

  let message = "";
  if (status === "past_due") {
    message =
      "Your payment has failed. Please update your billing details to continue using STRABB.";
  } else if (status === "cancelled") {
    message = "Your subscription has been cancelled. Upgrade to continue using STRABB.";
  } else if (status === "trial" && data.subscription?.trialEndsAt) {
    message = "Your free trial has expired. Upgrade to continue using STRABB.";
  } else if (!data.subscription) {
    message = "Start your free trial to begin using STRABB.";
  }

  if (!message) return null;

  return (
    <div className="px-sm py-base border-b border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
      <div className="gap-base text-body flex items-center text-yellow-800 dark:text-yellow-200">
        <AlertTriangleIcon className="size-sm shrink-0" />
        <p>
          {message}{" "}
          <Link href="/settings" className="font-medium underline underline-offset-2">
            Go to billing
          </Link>
        </p>
      </div>
    </div>
  );
}
