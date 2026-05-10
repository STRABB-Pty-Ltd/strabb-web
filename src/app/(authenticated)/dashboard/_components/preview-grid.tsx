"use client";

import { useMemo } from "react";
import { addDays, format, parseISO } from "date-fns";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import type { PreviewData } from "@/hooks/use-dashboard";
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
          View All <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

function MiniCalendar({ data }: { data: PreviewData["miniCalendar"] }) {
  const router = useRouter();
  const setSubmenu = useAppStore((s) => s.setSubmenu);
  const setView = useAppStore((s) => s.setView);
  const setTimeframe = useAppStore((s) => s.setTimeframe);
  const setCustomRange = useAppStore((s) => s.setCustomRange);

  const handleViewAll = () => {
    const start = new Date();
    const end = addDays(start, 6);
    const fmt = (d: Date) => format(d, "yyyy-MM-dd");
    setCustomRange({ start: fmt(start), end: fmt(end) });
    setSubmenu("calendar", ["overview"]);
    setView("calendar", "gantt");
    setTimeframe("calendar", "custom", null);
    router.push("/calendar");
  };

  return (
    <div
      className="p-md rounded-xl transition-shadow hover:shadow-md"
      style={{ backgroundColor: "var(--surface-card)" }}
    >
      <PanelHeader title="Next 7 Days" onView={handleViewAll} />
      <div className="gap-xs grid grid-cols-7">
        {data.map((day) => {
          const d = new Date(day.date + "T00:00:00");
          const hasBookings = day.bookings > 0;
          return (
            <div key={day.date} className="text-center">
              <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                {format(d, "EEE")}
              </p>
              <p className="text-body font-medium" style={{ color: "var(--highlight-10)" }}>
                {format(d, "d")}
              </p>
              <div
                className="mt-xs h-md text-body mx-auto w-md rounded-full text-center leading-5"
                style={{
                  backgroundColor: hasBookings ? "var(--highlight-10)" : "var(--surface-60)",
                  color: hasBookings ? "var(--surface-60)" : "var(--highlight-10)",
                }}
              >
                {day.bookings}
              </div>
            </div>
          );
        })}
      </div>
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

function RevenueSparkline({
  data,
  windowSize,
}: {
  data: PreviewData["revenueSparkline"];
  windowSize: string;
}) {
  const bars = useMemo(() => bucketRevenue(data, windowSize), [data, windowSize]);
  const max = Math.max(...bars.map((d) => d.revenue), 1);
  return (
    <div className="p-md rounded-xl" style={{ backgroundColor: "var(--surface-card)" }}>
      <PanelHeader title="Revenue Trend" />
      <div className="gap-base flex items-end" style={{ height: 89 }}>
        {bars.map((d) => (
          <div key={d.label} className="gap-xs flex flex-1 flex-col items-center">
            <div
              className="w-full rounded-t-sm"
              style={{
                height: Math.max(5, (d.revenue / max) * 55),
                backgroundColor: "var(--chart-bar)",
              }}
            />
            <span className="text-body" style={{ color: "var(--text-secondary)" }}>
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
      style={{ backgroundColor: "var(--surface-card)" }}
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

  const handleViewAll = () => router.push("/cleaning");

  return (
    <div
      className="p-md rounded-xl transition-shadow hover:shadow-md"
      style={{ backgroundColor: "var(--surface-card)" }}
    >
      <PanelHeader title="Cleans and Tickets" onView={handleViewAll} />
      {data.length === 0 ? (
        <EmptyState compact icon={Sparkles} title="No upcoming cleans or tickets" />
      ) : (
        <div className="flex flex-col">
          {data.map((item) => (
            <div
              key={`${item.kind}-${item.id}`}
              className="gap-sm py-base text-body flex items-center"
              style={{ color: "var(--highlight-10)" }}
            >
              <span
                className="h-base w-base shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    item.kind === "ticket" ? "var(--status-issues)" : "var(--highlight-10)",
                }}
              />
              <span className="flex-1 truncate">{item.listing || "Unassigned"}</span>
              <span className="text-body" style={{ color: "var(--text-secondary)" }}>
                {format(new Date(item.date), "d MMM")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PreviewGrid({ data, windowSize }: PreviewGridProps) {
  return (
    <div className="gap-sm grid grid-cols-1 lg:grid-cols-2">
      <MiniCalendar data={data.miniCalendar} />
      <RevenueSparkline data={data.revenueSparkline} windowSize={windowSize} />
      <UpcomingBookings data={data.upcomingBookings} />
      <CleansAndTickets data={data.cleansAndTickets} />
    </div>
  );
}
