"use client";

import { ArrowRightIcon, CheckCircleIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useProperties } from "@/hooks/use-properties";
import { useListings } from "@/hooks/use-listings";
import { useBillingStatus } from "@/hooks/use-billing";

function Step({
  number,
  title,
  description,
  href,
  done,
}: {
  number: number;
  title: string;
  description: string;
  href: string;
  done: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-start gap-4 rounded-xl border p-5 transition-colors ${done ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/50" : "hover:bg-muted/50"}`}
    >
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-muted text-muted-foreground"}`}
      >
        {done ? <CheckCircleIcon className="size-5" /> : number}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${done ? "text-green-700 dark:text-green-300" : ""}`}>
          {title}
          {done && <span className="ml-2 text-xs font-normal">Done</span>}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
      <ArrowRightIcon className="text-muted-foreground mt-1 size-4 shrink-0" />
    </Link>
  );
}

export default function OnboardingPage() {
  const { data: properties } = useProperties();
  const { data: listings } = useListings();
  const { data: billing } = useBillingStatus();

  const hasProperties = (properties?.meta.total ?? 0) > 0;
  const hasListings = (listings?.meta.total ?? 0) > 0;
  const hasIcal = (listings?.data ?? []).some((l) => l.icalFeedUrl);
  const hasBilling = billing?.hasActiveSubscription ?? false;

  const allDone = hasProperties && hasListings && hasIcal && hasBilling;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome to STRABB"
        description="Let's get you set up. Complete these steps to start managing your rentals."
      />

      <div className="mx-auto max-w-lg space-y-3">
        <Step
          number={1}
          title="Add your first property"
          description="Create a property with address, timezone, and cleaner details."
          href="/properties"
          done={hasProperties}
        />
        <Step
          number={2}
          title="Create a listing"
          description="Add a listing for each platform your property is on (Airbnb, Booking.com, etc.)."
          href="/listings"
          done={hasListings}
        />
        <Step
          number={3}
          title="Attach an iCal feed"
          description="Copy the iCal URL from your booking platform and paste it into your listing."
          href="/listings"
          done={hasIcal}
        />
        <Step
          number={4}
          title="Start your free trial"
          description="Get 14 days free — no card required."
          href="/settings"
          done={hasBilling}
        />
      </div>

      {allDone && (
        <div className="mx-auto max-w-lg text-center">
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950">
            <CheckCircleIcon className="mx-auto mb-3 size-8 text-green-600 dark:text-green-400" />
            <p className="font-medium text-green-800 dark:text-green-200">You&apos;re all set!</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Your bookings will sync automatically. Head to the dashboard to see them.
            </p>
            <Link href="/dashboard">
              <Button className="mt-4">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
