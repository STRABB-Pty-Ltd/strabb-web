"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ListingResponse } from "@/lib/schemas/listing";

import { RatesCalendar } from "./rates-calendar";
import { RestrictionsCalendar } from "./restrictions-calendar";

type TabKey = "general" | "rates" | "restrictions" | "availability" | "channex";

interface ListingRowProps {
  listing: ListingResponse;
  /** General-tab content — the existing photos / pricing / amenities form
   *  blocks. Passed in by the page so this component stays narrow. */
  generalTabContent: ReactNode;
  /** Channex-mapping form (already wired to the existing
   *  `useUpdateChannexMapping` hook). */
  channexTabContent: ReactNode;
  /** Listing's base nightly rate for the Rates tab's fallback display. */
  baseNightlyRate: number | null;
}

/**
 * Accordion row for a single listing on the /settings/listings page.
 *
 * Collapsed state shows just the listing's name + platform + a sync
 * status badge — clicking expands the body. The body lazy-mounts:
 * collapsed rows render nothing inside, so listing-state queries don't
 * fire for the eight other listings the user isn't editing.
 *
 * The body's active tab is also lazy: the Rates calendar only fetches
 * its window when the user actually selects the Rates tab on this row.
 */
export function ListingRow({
  listing,
  generalTabContent,
  channexTabContent,
  baseNightlyRate,
}: ListingRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  return (
    <div className="rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="px-sm py-sm flex w-full items-center justify-between text-left transition-colors outline-none hover:bg-[var(--neutral-30)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
        aria-expanded={isOpen}
        aria-controls={`listing-${listing.id}-body`}
      >
        <div className="gap-base flex items-center">
          {isOpen ? (
            <ChevronDown size={16} aria-hidden="true" />
          ) : (
            <ChevronRight size={16} aria-hidden="true" />
          )}
          <span className="text-subheading text-highlight-10 font-semibold">{listing.name}</span>
        </div>
        <div className="gap-sm flex items-center">
          <span className="text-body" style={{ color: "var(--text-secondary)" }}>
            {listing.platform}
          </span>
          {listing.channexPropertyId && (
            <span
              className="px-base text-body rounded py-1"
              style={{
                backgroundColor: "var(--status-success)",
                color: "var(--status-success-fg)",
              }}
            >
              Channex
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div
          id={`listing-${listing.id}-body`}
          className="px-sm py-md border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="rates">Rates</TabsTrigger>
              <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="channex">Channex</TabsTrigger>
            </TabsList>

            <TabsContent value="general">{generalTabContent}</TabsContent>

            <TabsContent value="rates">
              {activeTab === "rates" && (
                <RatesCalendar listingId={listing.id} baseNightlyRate={baseNightlyRate} />
              )}
            </TabsContent>

            <TabsContent value="restrictions">
              {activeTab === "restrictions" && <RestrictionsCalendar listingId={listing.id} />}
            </TabsContent>

            <TabsContent value="availability">
              <PlaceholderTab label="Availability editor lands in F.9." />
            </TabsContent>

            <TabsContent value="channex">{channexTabContent}</TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <p className="text-body" style={{ color: "var(--text-secondary)" }}>
      {label}
    </p>
  );
}
