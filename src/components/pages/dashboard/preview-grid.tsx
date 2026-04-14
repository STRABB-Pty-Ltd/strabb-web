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

function PanelHeader({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      <Link
        href={href}
        className="flex items-center gap-1 text-xs font-medium"
        style={{ color: "var(--strabb-secondary)" }}
      >
        View All <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function MiniCalendar({
  data,
}: {
  data: PreviewData["miniCalendar"];
}) {
  return (
    <div
      className="rounded-lg border bg-white p-4"
      style={{ borderColor: "var(--border)" }}
    >
      <PanelHeader title="Next 7 Days" href="/calendar" />
      <div className="grid grid-cols-7 gap-1">
        {data.map((day) => {
          const d = new Date(day.date + "T00:00:00");
          return (
            <div key={day.date} className="text-center">
              <p className="text-xs text-gray-400">
                {format(d, "EEE")}
              </p>
              <p className="text-sm font-medium text-gray-700">
                {format(d, "d")}
              </p>
              <div
                className="mx-auto mt-1 h-5 w-5 rounded-full text-center text-xs leading-5"
                style={{
                  backgroundColor:
                    day.bookings > 0
                      ? "var(--strabb-secondary)"
                      : "#F3F4F6",
                  color: day.bookings > 0 ? "white" : "#9CA3AF",
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

function RevenueSparkline({
  data,
}: {
  data: PreviewData["revenueSparkline"];
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div
      className="rounded-lg border bg-white p-4"
      style={{ borderColor: "var(--border)" }}
    >
      <PanelHeader title="Revenue Trend" href="/reporting" />
      <div className="flex items-end gap-1" style={{ height: 80 }}>
        {data.map((d) => (
          <div
            key={d.label}
            className="flex flex-1 flex-col items-center"
          >
            <div
              className="w-full rounded-t"
              style={{
                height: Math.max(4, (d.revenue / max) * 60),
                backgroundColor: "var(--strabb-secondary)",
                opacity: 0.7,
              }}
            />
            <span className="mt-1 text-[10px] text-gray-400">
              {d.label.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingBookings({
  data,
}: {
  data: PreviewData["upcomingBookings"];
}) {
  return (
    <div
      className="rounded-lg border bg-white p-4"
      style={{ borderColor: "var(--border)" }}
    >
      <PanelHeader title="Upcoming Bookings" href="/calendar" />
      {data.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">
          No upcoming bookings
        </p>
      ) : (
        <div className="space-y-2">
          {data.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm"
              style={{ backgroundColor: "#F9FAFB" }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: channelColors[b.channel] ?? "#6B7280",
                }}
              />
              <span className="flex-1 truncate text-gray-700">
                {b.guest}
              </span>
              <span className="text-xs text-gray-400">
                {format(new Date(b.checkIn), "d MMM")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskSummary({
  data,
}: {
  data: PreviewData["taskSummary"];
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div
      className="rounded-lg border bg-white p-4"
      style={{ borderColor: "var(--border)" }}
    >
      <PanelHeader title="Task Summary" href="/cleaning" />
      {total === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">
          No tasks
        </p>
      ) : (
        <div className="space-y-2">
          {data
            .filter((d) => d.count > 0)
            .map((d) => (
              <div
                key={d.status}
                className="flex items-center gap-2 text-sm"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="flex-1 capitalize text-gray-600">
                  {d.status.replace("_", " ")}
                </span>
                <span className="font-data font-medium text-gray-900">
                  {d.count}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export function PreviewGrid({ data }: PreviewGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <MiniCalendar data={data.miniCalendar} />
      <RevenueSparkline data={data.revenueSparkline} />
      <UpcomingBookings data={data.upcomingBookings} />
      <TaskSummary data={data.taskSummary} />
    </div>
  );
}
