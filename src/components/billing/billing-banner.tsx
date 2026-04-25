"use client";

import { differenceInCalendarDays } from "date-fns";
import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";

import { useBillingStatus } from "@/hooks/use-billing";

const TRIAL_BANNER_THRESHOLD_DAYS = 7;

export function BillingBanner() {
  const { data } = useBillingStatus();

  if (!data) return null;
  if (data.hasActiveSubscription) return null;

  const status = data.subscription?.status;
  const trialEndsAt = data.subscription?.trialEndsAt;

  let message = "";
  if (status === "past_due") {
    message =
      "Your payment has failed. Please update your billing details to continue using STRABB.";
  } else if (status === "cancelled") {
    message = "Your subscription has been cancelled. Upgrade to continue using STRABB.";
  } else if (status === "trial" && trialEndsAt) {
    const daysLeft = differenceInCalendarDays(new Date(trialEndsAt), new Date());
    if (daysLeft < 0) {
      message = "Your free trial has expired. Upgrade to continue using STRABB.";
    } else if (daysLeft <= TRIAL_BANNER_THRESHOLD_DAYS) {
      const dayWord = daysLeft === 1 ? "day" : "days";
      message =
        daysLeft === 0
          ? "Your free trial ends today. Upgrade to keep using STRABB."
          : `${daysLeft} ${dayWord} left in your free trial. Add payment details to keep using STRABB.`;
    }
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
