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
        className="gap-xs text-body flex items-center font-medium"
        style={{ color: "var(--brand-10)" }}
      >
        View All <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function MiniCalendar({ data }: { data: PreviewData["miniCalendar"] }) {
  return (
    <div className="p-md rounded-xl" style={{ backgroundColor: "var(--surface-card)" }}>
      <PanelHeader title="Next 7 Days" href="/calendar" />
      <div className="gap-xs grid grid-cols-7">
        {data.map((day) => {
          const d = new Date(day.date + "T00:00:00");
          const hasBookings = day.bookings > 0;
          return (
            <div key={day.date} className="text-center">
              <p className="text-body" style={{ color: "var(--brand-10)", opacity: 0.55 }}>
                {format(d, "EEE")}
              </p>
              <p className="text-body font-medium" style={{ color: "var(--brand-10)" }}>
                {format(d, "d")}
              </p>
              <div
                className="mt-xs h-md text-body mx-auto w-md rounded-full text-center leading-5"
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
    <div className="p-md rounded-xl" style={{ backgroundColor: "var(--surface-card)" }}>
      <PanelHeader title="Revenue Trend" href="/reporting" />
      <div className="gap-base flex items-end" style={{ height: 89 }}>
        {data.map((d) => (
          <div key={d.label} className="gap-xs flex flex-1 flex-col items-center">
            <div
              className="w-full rounded-t-sm"
              style={{
                height: Math.max(5, (d.revenue / max) * 55),
                backgroundColor: "var(--chart-bar)",
              }}
            />
            <span className="text-body" style={{ color: "var(--brand-10)", opacity: 0.55 }}>
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
    <div className="p-md rounded-xl" style={{ backgroundColor: "var(--surface-card)" }}>
      <PanelHeader title="Upcoming Bookings" href="/calendar" />
      {data.length === 0 ? (
        <p
          className="py-sm text-body text-center"
          style={{ color: "var(--brand-10)", opacity: 0.55 }}
        >
          No upcoming bookings
        </p>
      ) : (
        <div className="flex flex-col">
          {data.map((b) => (
            <div
              key={b.id}
              className="gap-sm py-base text-body flex items-center"
              style={{ color: "var(--brand-10)" }}
            >
              <span
                className="h-base w-base shrink-0 rounded-full"
                style={{
                  backgroundColor: channelColors[b.channel] ?? "var(--brand-10)",
                }}
              />
              <span className="flex-1 truncate">{b.guest}</span>
              <span className="text-body" style={{ opacity: 0.55 }}>
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
    <div className="p-md rounded-xl" style={{ backgroundColor: "var(--surface-card)" }}>
      <PanelHeader title="Task Summary" href="/cleaning" />
      {total === 0 ? (
        <p
          className="py-sm text-body text-center"
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
                className="gap-sm py-base text-body flex items-center"
                style={{ color: "var(--brand-10)" }}
              >
                <span className="h-base w-base rounded-full" style={{ backgroundColor: d.color }} />
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
    <div className="gap-sm grid grid-cols-1 lg:grid-cols-2">
      <MiniCalendar data={data.miniCalendar} />
      <RevenueSparkline data={data.revenueSparkline} />
      <UpcomingBookings data={data.upcomingBookings} />
      <TaskSummary data={data.taskSummary} />
    </div>
  );
}
