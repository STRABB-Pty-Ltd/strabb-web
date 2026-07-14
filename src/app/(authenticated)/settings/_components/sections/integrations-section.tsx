"use client";

import {
  ArrowRight,
  Calculator,
  CalendarSync,
  Home,
  KeyRound,
  Link2,
  Network,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Chip } from "@/components/ui/chip";
import { useAppStore } from "@/stores/app-store";

interface IntegrationCard {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: "connected" | "available" | "coming-soon";
  ctaHref?: string;
  ctaLabel?: string;
}

// 3rd-party software the operator wires STRABB to. NOT the OTAs - those
// live in the Channels section, which handles their sync + pricing rules.
const integrations: IntegrationCard[] = [
  {
    id: "channex",
    name: "Channex",
    description:
      "Channel manager - distributes inventory and rates to Airbnb, Booking.com, and Vrbo from a single API.",
    icon: Network,
    status: "available",
    ctaHref: "/settings/listings",
    ctaLabel: "Listings & mapping",
  },
  {
    id: "listings",
    name: "Listings",
    description: "Photos, pricing, stay rules, amenities, and description for each STRABB listing.",
    icon: Home,
    status: "available",
    ctaHref: "/settings/listings",
    ctaLabel: "Open listings editor",
  },
  {
    id: "shareable-links",
    name: "Shareable links",
    description:
      "Read-only public URLs for sharing dashboards, calendars, or reports with cleaners, owners, or accountants.",
    icon: Link2,
    status: "available",
    ctaHref: "/settings/shareable-links",
    ctaLabel: "Manage links",
  },
  {
    id: "ical",
    name: "iCal feeds",
    description:
      "Pull bookings from any OTA or external calendar that publishes an iCal URL. Fallback for direct integrations not yet supported.",
    icon: CalendarSync,
    status: "available",
  },
  {
    id: "xero",
    name: "Xero",
    description:
      "Push booking revenue, channel fees, and cleaning supply costs into Xero for accounting and BAS.",
    icon: Calculator,
    status: "coming-soon",
  },
  {
    id: "smart-locks",
    name: "Smart locks",
    description:
      "Auto-generate per-stay access codes for Yale, August, Schlage, and other supported smart locks.",
    icon: KeyRound,
    status: "coming-soon",
  },
  {
    id: "dynamic-pricing",
    name: "Dynamic pricing",
    description:
      "Push optimised nightly rates from PriceLabs, Beyond, or Wheelhouse to your STRABB listings.",
    icon: TrendingUp,
    status: "coming-soon",
  },
];

const statusStyle: Record<IntegrationCard["status"], { bg: string; text: string; label: string }> =
  {
    connected: {
      bg: "var(--status-success-tint)",
      text: "var(--status-success)",
      label: "Connected",
    },
    available: {
      bg: "var(--neutral-30)",
      text: "var(--highlight-10)",
      label: "Available",
    },
    "coming-soon": {
      bg: "var(--neutral-30)",
      text: "var(--text-secondary)",
      label: "Coming soon",
    },
  };

export function IntegrationsSection() {
  const addToast = useAppStore((s) => s.addToast);

  const handleConnect = (name: string) => {
    addToast({
      type: "info",
      message: `${name} setup is coming soon`,
    });
  };

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading text-highlight-10 font-semibold">Integrations</h2>
        <p className="text-body text-highlight-10">
          Third-party software STRABB talks to. Per-channel sync rules live under the Channels
          section.
        </p>
      </div>

      <div className="space-y-sm">
        {integrations.map((it) => {
          const style = statusStyle[it.status];
          const Icon = it.icon;
          return (
            <div
              key={it.id}
              className="gap-sm px-sm py-sm flex items-start rounded-lg border"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="h-lg flex w-lg shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: "var(--neutral-30)" }}
              >
                <Icon className="text-highlight-10" size={18} aria-hidden="true" />
              </div>
              <div className="space-y-xs min-w-0 flex-1">
                <div className="gap-base flex items-center">
                  <p className="text-body text-highlight-10 font-medium">{it.name}</p>
                  <Chip tone="solid" color={style.bg} textColor={style.text} size="sm" radius="md">
                    {style.label}
                  </Chip>
                </div>
                <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                  {it.description}
                </p>
                {it.ctaHref && it.ctaLabel && (
                  <Link
                    href={it.ctaHref}
                    className="gap-xs text-body text-highlight-10 inline-flex items-center font-medium hover:underline"
                  >
                    {it.ctaLabel} <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                )}
                {!it.ctaHref && it.status === "coming-soon" && (
                  <button
                    type="button"
                    onClick={() => handleConnect(it.name)}
                    className="text-body text-highlight-10 rounded text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
                    data-no-elevate
                  >
                    Notify me when this lands
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
