"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ArrowRight, BrushCleaning, CalendarDays, ShoppingBag, Sparkles, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import type { PreviewData } from "@/hooks/use-dashboard";
import { useShoppingList } from "@/hooks/use-cleaning";
import { useAppStore } from "@/stores/app-store";

interface PreviewGridProps {
  data: PreviewData;
  windowSize: string;
}

function PanelHeader({ title, onView }: { title: string; onView?: () => void }) {
  return (
    <div className="mb-sm flex items-center justify-between">
      <h3 className="text-subheading font-semibold" style={{ color: "var(--highlight-10)" }}>
        {title}
      </h3>
      {onView && (
        <button
          type="button"
          onClick={onView}
          className="gap-xs text-body flex items-center font-medium"
          style={{ color: "var(--highlight-10)" }}
          data-no-elevate
        >
          View All <ArrowRight size={12} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function ShoppingListPanel() {
  const selectedListings = useAppStore((s) => s.selectedListings);
  const openShoppingListPopup = useAppStore((s) => s.openShoppingListPopup);
  const boughtItems = useAppStore((s) => s.operations.boughtItems);
  const { data: items = [] } = useShoppingList(selectedListings);

  const needed = useMemo(() => items.filter((i) => !boughtItems.includes(i.id)), [
    items,
    boughtItems,
  ]);
  // Top 5 by priority (high first) so the panel previews what matters,
  // not what happens to be at the top of the alphabetical list.
  const top = useMemo(() => {
    const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...needed]
      .sort((a, b) => (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3))
      .slice(0, 5);
  }, [needed]);

  return (
    <div
      className="p-md rounded-xl transition-shadow hover:shadow-md"
      style={{ backgroundColor: "var(--neutral-30)" }}
    >
      <PanelHeader title="Shopping List" onView={openShoppingListPopup} />
      {needed.length === 0 ? (
        <EmptyState compact icon={ShoppingBag} title="Nothing needed" />
      ) : (
        <div className="space-y-xs">
          {top.map((item) => (
            <div key={item.id} className="gap-base flex items-center">
              <span
                className="px-base py-xs text-body shrink-0 rounded-md font-medium"
                style={{
                  backgroundColor: "var(--neutral-30)",
                  color:
                    item.priority === "high"
                      ? "var(--status-danger)"
                      : "var(--highlight-10)",
                }}
              >
                {item.priority}
              </span>
              <span className="text-body text-highlight-10 flex-1 truncate">{item.item}</span>
              <span className="font-data text-body text-highlight-10 shrink-0">
                x{item.quantity}
              </span>
            </div>
          ))}
          {needed.length > top.length && (
            <button
              type="button"
              onClick={openShoppingListPopup}
              className="text-body pt-xs rounded text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ color: "var(--text-secondary)" }}
              data-no-elevate
            >
              {needed.length - top.length} more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatBarLabel(rawLabel: string): string {
  // "YYYY-MM" → month name; "YYYY-Qn" → "Qn"; "YYYY" → year as-is.
  if (/^\d{4}-Q[1-4]$/.test(rawLabel)) return rawLabel.slice(5);
  if (/^\d{4}$/.test(rawLabel)) return rawLabel;
  const iso = rawLabel.length === 7 ? `${rawLabel}-01` : rawLabel;
  try {
    return format(parseISO(iso), "MMM");
  } catch {
    return rawLabel;
  }
}

// Aggregate the monthly revenue series into the right buckets for the
// dashboard's current windowSize, then trim to the trailing N entries
// ending at the most recent bucket. month → 6, quarter → 4, year → 5.
function bucketRevenue(
  data: PreviewData["revenueSparkline"],
  windowSize: string,
): PreviewData["revenueSparkline"] {
  const sortedMonths = [...data].sort((a, b) => a.label.localeCompare(b.label));

  if (windowSize === "quarter") {
    const buckets = new Map<string, number>();
    for (const d of sortedMonths) {
      const [year, month] = d.label.split("-").map(Number);
      const q = Math.ceil(month / 3);
      const key = `${year}-Q${q}`;
      buckets.set(key, (buckets.get(key) ?? 0) + d.revenue);
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-4)
      .map(([label, revenue]) => ({ label, revenue }));
  }

  if (windowSize === "year") {
    const buckets = new Map<string, number>();
    for (const d of sortedMonths) {
      const year = d.label.slice(0, 4);
      buckets.set(year, (buckets.get(year) ?? 0) + d.revenue);
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-5)
      .map(([label, revenue]) => ({ label, revenue }));
  }

  // month (and any other) → last 6 months
  return sortedMonths.slice(-6);
}

const formatAUDShort = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);

function buildSparklineSummary(bars: PreviewData["revenueSparkline"]): string {
  if (bars.length === 0) return "";
  const peak = bars.reduce((a, b) => (b.revenue > a.revenue ? b : a));
  const latest = bars[bars.length - 1];
  const first = bars[0].revenue;
  const direction =
    latest.revenue > first * 1.05
      ? "trending up"
      : latest.revenue < first * 0.95
        ? "trending down"
        : "broadly flat";
  return (
    `Revenue sparkline across ${bars.length} periods, ${direction}. ` +
    `Latest ${formatBarLabel(latest.label)}: ${formatAUDShort(latest.revenue)}. ` +
    `Peak ${formatBarLabel(peak.label)}: ${formatAUDShort(peak.revenue)}.`
  );
}

function RevenueSparkline({
  data,
  windowSize,
}: {
  data: PreviewData["revenueSparkline"];
  windowSize: string;
}) {
  const bars = useMemo(() => bucketRevenue(data, windowSize), [data, windowSize]);
  const max = Math.max(...bars.map((d) => d.revenue), 1);
  const summary = buildSparklineSummary(bars);
  return (
    <div className="p-md rounded-xl" style={{ backgroundColor: "var(--neutral-30)" }}>
      <PanelHeader title="Revenue Trend" />
      <div
        role={summary ? "img" : undefined}
        aria-label={summary}
        className="gap-base flex items-end"
        style={{ height: 89 }}
      >
        {bars.map((d) => (
          <div key={d.label} className="gap-xs flex flex-1 flex-col items-center">
            <div
              aria-hidden="true"
              className="w-full rounded-t-sm"
              style={{
                height: Math.max(5, (d.revenue / max) * 55),
                backgroundColor: "var(--highlight-10)",
              }}
            />
            <span
              aria-hidden="true"
              className="text-body"
              style={{ color: "var(--text-secondary)" }}
            >
              {formatBarLabel(d.label)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

function UpcomingBookings({ data }: { data: PreviewData["upcomingBookings"] }) {
  const router = useRouter();
  const setSubmenu = useAppStore((s) => s.setSubmenu);
  const setView = useAppStore((s) => s.setView);
  const setTimeframe = useAppStore((s) => s.setTimeframe);

  const handleViewAll = () => {
    setSubmenu("calendar", ["overview"]);
    setView("calendar", "gantt");
    setTimeframe("calendar", "fortnight", null);
    router.push("/calendar");
  };

  return (
    <div
      className="p-md rounded-xl transition-shadow hover:shadow-md"
      style={{ backgroundColor: "var(--neutral-30)" }}
    >
      <PanelHeader title="Upcoming Bookings" onView={handleViewAll} />
      {data.length === 0 ? (
        <EmptyState compact icon={CalendarDays} title="No upcoming bookings" />
      ) : (
        <div className="flex flex-col">
          {data.map((b) => (
            <div
              key={b.id}
              className="gap-sm py-base text-body flex items-center"
              style={{ color: "var(--highlight-10)" }}
            >
              <span
                className="h-base w-base shrink-0 rounded-full"
                style={{
                  backgroundColor: channelColors[b.channel] ?? "var(--highlight-10)",
                }}
              />
              <span className="flex-1 truncate">{b.guest}</span>
              <span className="text-body" style={{ color: "var(--text-secondary)" }}>
                {format(new Date(b.checkIn), "d MMM")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CleansAndTickets({ data }: { data: PreviewData["cleansAndTickets"] }) {
  const router = useRouter();

  const handleViewAll = () => router.push("/operations");

  return (
    <div
      className="p-md rounded-xl transition-shadow hover:shadow-md"
      style={{ backgroundColor: "var(--neutral-30)" }}
    >
      <PanelHeader title="Cleans and Tickets" onView={handleViewAll} />
      {data.length === 0 ? (
        <EmptyState compact icon={Sparkles} title="No upcoming cleans or tickets" />
      ) : (
        <div className="flex flex-col">
          {data.map((item) => {
            const Icon = item.kind === "ticket" ? Wrench : BrushCleaning;
            const iconColor =
              item.kind === "ticket" ? "var(--status-issues)" : "var(--highlight-10)";
            return (
              <div
                key={`${item.kind}-${item.id}`}
                className="gap-sm py-base text-body flex items-center"
                style={{ color: "var(--highlight-10)" }}
              >
                <Icon size={12} style={{ color: iconColor, flexShrink: 0 }} aria-hidden="true" />
                <span className="sr-only">{item.kind === "ticket" ? "Ticket" : "Cleaning"}.</span>
                <span className="flex-1 truncate">{item.listing || "Unassigned"}</span>
                <span className="text-body" style={{ color: "var(--text-secondary)" }}>
                  {format(new Date(item.date), "d MMM")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PreviewGrid({ data, windowSize }: PreviewGridProps) {
  return (
    <div className="gap-sm grid grid-cols-1 lg:grid-cols-2">
      <ShoppingListPanel />
      <RevenueSparkline data={data.revenueSparkline} windowSize={windowSize} />
      <UpcomingBookings data={data.upcomingBookings} />
      <CleansAndTickets data={data.cleansAndTickets} />
    </div>
  );
}
