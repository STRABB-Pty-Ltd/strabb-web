"use client";

import { differenceInCalendarDays } from "date-fns";
import Link from "next/link";

import { chipVariants } from "@/components/ui/chip";
import { useBillingStatus } from "@/hooks/use-billing";
import { cn } from "@/lib/utils";

const TRIAL_WARNING_THRESHOLD_DAYS = 3;

type Tone = "neutral" | "warning" | "danger" | "cta";

// Tone -> token map. Tints + accents are theme-tuned in globals.css.
const toneStyles: Record<Tone, { bg: string; text: string; border: string }> = {
  neutral: {
    bg: "var(--neutral-30)",
    text: "var(--highlight-10)",
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
    // Filled brand pill. The bg is --strabb-secondary which IS --highlight-10
    // (a flipping token), so text uses --surface-60 directly - it inverts
    // OPPOSITE to highlight-10 and stays readable in both themes.
    // Don't switch to --text-on-color here: that token flips the same way
    // as highlight-10 and would render warm-white-on-warm-white in dark mode.
    bg: "var(--highlight-10)",
    text: "var(--surface-60)",
    border: "var(--highlight-10)",
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
      // chipVariants composed onto the Link (the chip.tsx-documented pattern).
      // tone is null because the pill's colours are the runtime toneStyles
      // lookup above (kept inline); interactive is off so the pill keeps its
      // own quieter transition-opacity/hover:opacity-90 affordance.
      className={cn(
        chipVariants({ tone: null, size: "md", radius: "pill" }),
        "mr-sm border transition-opacity hover:opacity-90",
      )}
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
