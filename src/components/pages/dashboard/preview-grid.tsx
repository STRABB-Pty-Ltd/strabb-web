"use client";

import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { PreviewData } from "@/hooks/use-dashboard";

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

interface PreviewGridProps {
  data: PreviewData;
}

function PanelHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-sm flex items-center justify-between">
      <h3 className="text-subheading font-semibold" style={{ color: "var(--brand-10)" }}>
        {title}
      </h3>
      <Link
        href={href}
        className="flex items-center gap-1 text-xs font-medium"
        style={{ color: "var(--brand-10)" }}
      >
        View All <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function MiniCalendar({ data }: { data: PreviewData["miniCalendar"] }) {
  return (
    <div className="rounded-xl p-md" style={{ backgroundColor: "var(--surface-card)" }}>
      <PanelHeader title="Next 7 Days" href="/calendar" />
      <div className="grid grid-cols-7 gap-1">
        {data.map((day) => {
          const d = new Date(day.date + "T00:00:00");
          const hasBookings = day.bookings > 0;
          return (
            <div key={day.date} className="text-center">
              <p className="text-xs" style={{ color: "var(--brand-10)", opacity: 0.55 }}>
                {format(d, "EEE")}
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--brand-10)" }}
              >
                {format(d, "d")}
              </p>
              <div
                className="mx-auto mt-1 h-5 w-5 rounded-full text-center text-xs leading-5"
                style={{
                  backgroundColor: hasBookings ? "var(--brand-10)" : "var(--surface-60)",
                  color: hasBookings ? "var(--surface-60)" : "var(--brand-10)",
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

function RevenueSparkline({ data }: { data: PreviewData["revenueSparkline"] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="rounded-xl p-md" style={{ backgroundColor: "var(--surface-card)" }}>
      <PanelHeader title="Revenue Trend" href="/reporting" />
      <div className="flex items-end gap-2" style={{ height: 80 }}>
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t"
              style={{
                height: Math.max(4, (d.revenue / max) * 60),
                backgroundColor: "var(--chart-bar)",
              }}
            />
            <span className="text-[10px]" style={{ color: "var(--brand-10)", opacity: 0.55 }}>
              {d.label.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingBookings({ data }: { data: PreviewData["upcomingBookings"] }) {
  return (
    <div className="rounded-xl p-md" style={{ backgroundColor: "var(--surface-card)" }}>
      <PanelHeader title="Upcoming Bookings" href="/calendar" />
      {data.length === 0 ? (
        <p
          className="py-4 text-center text-sm"
          style={{ color: "var(--brand-10)", opacity: 0.55 }}
        >
          No upcoming bookings
        </p>
      ) : (
        <div className="flex flex-col">
          {data.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 py-2 text-sm"
              style={{ color: "var(--brand-10)" }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: channelColors[b.channel] ?? "var(--brand-10)",
                }}
              />
              <span className="flex-1 truncate">{b.guest}</span>
              <span className="text-xs" style={{ opacity: 0.55 }}>
                {format(new Date(b.checkIn), "d MMM")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskSummary({ data }: { data: PreviewData["taskSummary"] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="rounded-xl p-md" style={{ backgroundColor: "var(--surface-card)" }}>
      <PanelHeader title="Task Summary" href="/cleaning" />
      {total === 0 ? (
        <p
          className="py-4 text-center text-sm"
          style={{ color: "var(--brand-10)", opacity: 0.55 }}
        >
          No tasks
        </p>
      ) : (
        <div className="flex flex-col">
          {data
            .filter((d) => d.count > 0)
            .map((d) => (
              <div
                key={d.status}
                className="flex items-center gap-3 py-2 text-sm"
                style={{ color: "var(--brand-10)" }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="flex-1 capitalize">{d.status.replace("_", " ")}</span>
                <span className="font-data font-semibold">{d.count}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export function PreviewGrid({ data }: PreviewGridProps) {
  return (
    <div className="grid grid-cols-1 gap-sm lg:grid-cols-2">
      <MiniCalendar data={data.miniCalendar} />
      <RevenueSparkline data={data.revenueSparkline} />
      <UpcomingBookings data={data.upcomingBookings} />
      <TaskSummary data={data.taskSummary} />
    </div>
  );
}
