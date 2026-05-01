"use client";

import { differenceInCalendarDays } from "date-fns";
import Link from "next/link";

import { useBillingStatus } from "@/hooks/use-billing";

const TRIAL_WARNING_THRESHOLD_DAYS = 3;

type Tone = "neutral" | "warning" | "danger" | "cta";

// Tone -> token map. Tints + accents are theme-tuned in globals.css.
const toneStyles: Record<Tone, { bg: string; text: string; border: string }> = {
  neutral: {
    bg: "var(--neutral-30)",
    text: "var(--brand-10)",
    border: "var(--border)",
  },
  warning: {
    bg: "var(--status-warning-tint)",
    text: "var(--status-warning)",
    border: "var(--status-warning)",
  },
  danger: {
    bg: "var(--status-danger-tint)",
    text: "var(--status-danger)",
    border: "var(--status-danger)",
  },
  cta: {
    // Filled brand pill: always-light text on coloured bg.
    bg: "var(--strabb-secondary)",
    text: "var(--text-on-color)",
    border: "var(--strabb-secondary)",
  },
};

interface PillState {
  label: string;
  tone: Tone;
}

function pillStateFor(
  data: ReturnType<typeof useBillingStatus>["data"] | undefined,
): PillState | null {
  if (!data) return null;

  const sub = data.subscription;
  const status = sub?.status;

  if (status === "past_due") {
    return { label: "Payment failed", tone: "danger" };
  }
  if (status === "cancelled") {
    return { label: "Cancelled", tone: "danger" };
  }
  if (!sub) {
    return { label: "Start trial", tone: "cta" };
  }
  if (status === "trial" && sub.trialEndsAt) {
    const daysLeft = differenceInCalendarDays(new Date(sub.trialEndsAt), new Date());
    if (daysLeft < 0) {
      return { label: "Trial expired", tone: "danger" };
    }
    const tone: Tone = daysLeft <= TRIAL_WARNING_THRESHOLD_DAYS ? "warning" : "neutral";
    if (daysLeft === 0) return { label: "Trial ends today", tone: "warning" };
    const dayWord = daysLeft === 1 ? "day" : "days";
    return { label: `${daysLeft} ${dayWord} left`, tone };
  }
  return null;
}

export function BillingNavPill() {
  const { data } = useBillingStatus();
  const state = pillStateFor(data);

  if (!state) return null;

  const styles = toneStyles[state.tone];

  return (
    <Link
      href="/settings"
      aria-label={`Billing status: ${state.label}`}
      className="px-sm py-xs text-body mr-sm rounded-full border font-medium transition-opacity hover:opacity-90"
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        borderColor: styles.border,
      }}
    >
      {state.label}
    </Link>
  );
}
