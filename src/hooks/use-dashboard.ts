"use client";

import { useMemo } from "react";

import {
  USE_MOCK,
  mockBookingList,
  mockCleaningTaskList,
  mockFinancialList,
  mockMessageList,
} from "@/lib/mock-data";
import type { Booking } from "@/types/booking";
import type { CleaningTask } from "@/types/cleaning-task";
import type { Financial } from "@/types/financial";
import type { Message } from "@/types/message";

import { useAuthenticatedQuery } from "./use-authenticated-query";

export interface KPIData {
  label: string;
  value: string | number;
  icon: string;
  trend: number;
  type: "currency" | "number" | "percentage";
}

export interface AlertItem {
  id: string;
  type: "conflict" | "overdue" | "message" | "sync";
  severity: "red" | "amber" | "blue";
  description: string;
  count: number;
}

export interface PreviewData {
  miniCalendar: { date: string; bookings: number }[];
  revenueSparkline: { label: string; revenue: number }[];
  upcomingBookings: {
    id: string;
    guest: string;
    listing: string;
    checkIn: string;
    channel: string;
  }[];
  taskSummary: { status: string; count: number; color: string }[];
}

function computeKPIs(
  bookings: Booking[],
  tasks: CleaningTask[],
  financials: Financial[],
  selectedListings: string[],
): KPIData[] {
  const filtered =
    selectedListings.length > 0
      ? bookings.filter((b) => selectedListings.includes(b.listingId))
      : bookings;
  const filteredFinancials =
    selectedListings.length > 0
      ? financials.filter((f) => selectedListings.includes(f.listingId))
      : financials;
  const filteredTasks =
    selectedListings.length > 0
      ? tasks.filter((t) => selectedListings.includes(t.listingId))
      : tasks;

  const months = [...new Set(filteredFinancials.map((f) => f.month))].sort();
  const currentMonth = months[months.length - 1] ?? "";
  const prevMonth = months[months.length - 2] ?? "";

  const currentFinancials = filteredFinancials.filter(
    (f) => f.month === currentMonth,
  );
  const prevFinancials = filteredFinancials.filter(
    (f) => f.month === prevMonth,
  );

  const totalRevenue = currentFinancials.reduce((s, f) => s + f.revenue, 0);
  const prevRevenue = prevFinancials.reduce((s, f) => s + f.revenue, 0);
  const revenueTrend =
    prevRevenue > 0
      ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10
      : 0;

  const activeBookings = filtered.filter(
    (b) => b.status !== "cancelled" && b.status !== "checked_out",
  );

  const avgOccupancy =
    currentFinancials.length > 0
      ? Math.round(
          currentFinancials.reduce((s, f) => s + f.occupancyRate, 0) /
            currentFinancials.length,
        )
      : 0;
  const prevAvgOccupancy =
    prevFinancials.length > 0
      ? Math.round(
          prevFinancials.reduce((s, f) => s + f.occupancyRate, 0) /
            prevFinancials.length,
        )
      : 0;
  const occupancyTrend =
    prevAvgOccupancy > 0
      ? Math.round(
          ((avgOccupancy - prevAvgOccupancy) / prevAvgOccupancy) * 1000,
        ) / 10
      : 0;

  const avgNightlyRate =
    currentFinancials.length > 0
      ? Math.round(
          currentFinancials.reduce((s, f) => s + f.avgNightlyRate, 0) /
            currentFinancials.length,
        )
      : 0;

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingCheckIns = filtered.filter((b) => {
    const ci = new Date(b.checkIn);
    return ci >= now && ci <= nextWeek && b.status !== "cancelled";
  }).length;

  const activeTasks = filteredTasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled",
  ).length;

  return [
    {
      label: "Total Revenue",
      value: totalRevenue,
      icon: "dollar-sign",
      trend: revenueTrend,
      type: "currency",
    },
    {
      label: "Total Bookings",
      value: activeBookings.length,
      icon: "calendar",
      trend: 8.2,
      type: "number",
    },
    {
      label: "Avg Occupancy",
      value: avgOccupancy,
      icon: "percent",
      trend: occupancyTrend,
      type: "percentage",
    },
    {
      label: "Avg Nightly Rate",
      value: avgNightlyRate,
      icon: "bed",
      trend: 3.5,
      type: "currency",
    },
    {
      label: "Upcoming Check-ins",
      value: upcomingCheckIns,
      icon: "log-in",
      trend: 0,
      type: "number",
    },
    {
      label: "Active Tasks",
      value: activeTasks,
      icon: "sparkles",
      trend: -12.5,
      type: "number",
    },
  ];
}

function computeAlerts(
  tasks: CleaningTask[],
  messages: Message[],
  selectedListings: string[],
): AlertItem[] {
  const alerts: AlertItem[] = [];

  const filteredMessages =
    selectedListings.length > 0
      ? messages.filter((m) => selectedListings.includes(m.listingId))
      : messages;
  const filteredTasks =
    selectedListings.length > 0
      ? tasks.filter((t) => selectedListings.includes(t.listingId))
      : tasks;

  const unread = filteredMessages.filter((m) => m.status === "unread");
  if (unread.length > 0) {
    alerts.push({
      id: "alert-messages",
      type: "message",
      severity: "blue",
      description: `${unread.length} unread message${unread.length > 1 ? "s" : ""} requiring attention`,
      count: unread.length,
    });
  }

  const overdue = filteredTasks.filter(
    (t) =>
      (t.status === "pending" || t.status === "confirmed") &&
      new Date(t.scheduledTime) < new Date(),
  );
  if (overdue.length > 0) {
    alerts.push({
      id: "alert-overdue",
      type: "overdue",
      severity: "amber",
      description: `${overdue.length} cleaning task${overdue.length > 1 ? "s" : ""} overdue`,
      count: overdue.length,
    });
  }

  const issues = filteredTasks.filter((t) => t.status === "issues");
  if (issues.length > 0) {
    alerts.push({
      id: "alert-issues",
      type: "conflict",
      severity: "red",
      description: `${issues.length} cleaning task${issues.length > 1 ? "s" : ""} with reported issues`,
      count: issues.length,
    });
  }

  return alerts;
}

function computePreview(
  bookings: Booking[],
  tasks: CleaningTask[],
  financials: Financial[],
  selectedListings: string[],
): PreviewData {
  const now = new Date();
  const filtered =
    selectedListings.length > 0
      ? bookings.filter((b) => selectedListings.includes(b.listingId))
      : bookings;
  const filteredTasks =
    selectedListings.length > 0
      ? tasks.filter((t) => selectedListings.includes(t.listingId))
      : tasks;
  const filteredFinancials =
    selectedListings.length > 0
      ? financials.filter((f) => selectedListings.includes(f.listingId))
      : financials;

  const miniCalendar = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const count = filtered.filter(
      (b) =>
        b.checkIn <= dateStr &&
        b.checkOut >= dateStr &&
        b.status !== "cancelled",
    ).length;
    return { date: dateStr, bookings: count };
  });

  const months = [...new Set(filteredFinancials.map((f) => f.month))].sort();
  const revenueSparkline = months.map((month) => ({
    label: month,
    revenue: filteredFinancials
      .filter((f) => f.month === month)
      .reduce((s, f) => s + f.revenue, 0),
  }));

  const upcomingBookings = filtered
    .filter((b) => new Date(b.checkIn) >= now && b.status !== "cancelled")
    .sort(
      (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
    )
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      guest: b.guestName,
      listing: b.listingName,
      checkIn: b.checkIn,
      channel: b.channel,
    }));

  const statusCounts: Record<string, { count: number; color: string }> = {
    pending: { count: 0, color: "var(--status-pending)" },
    confirmed: { count: 0, color: "var(--status-confirmed)" },
    in_progress: { count: 0, color: "var(--status-in-progress)" },
    completed: { count: 0, color: "var(--status-completed)" },
    issues: { count: 0, color: "var(--status-issues)" },
  };
  for (const t of filteredTasks) {
    if (statusCounts[t.status]) statusCounts[t.status].count++;
  }
  const taskSummary = Object.entries(statusCounts).map(
    ([status, { count, color }]) => ({ status, count, color }),
  );

  return { miniCalendar, revenueSparkline, upcomingBookings, taskSummary };
}

export function useDashboardKPIs(
  timeframe: string,
  selectedListings: string[],
) {
  const mockResult = useMemo(
    () =>
      computeKPIs(
        mockBookingList,
        mockCleaningTaskList,
        mockFinancialList,
        selectedListings,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timeframe, selectedListings],
  );

  const apiResult = useAuthenticatedQuery<KPIData[]>(
    ["dashboard-kpis", timeframe, ...selectedListings],
    `/dashboard/kpis?timeframe=${timeframe}`,
    { enabled: !USE_MOCK },
  );

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }
  return {
    data: apiResult.data ?? [],
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useDashboardAlerts(selectedListings: string[]) {
  const mockResult = useMemo(
    () =>
      computeAlerts(mockCleaningTaskList, mockMessageList, selectedListings),
    [selectedListings],
  );

  const apiResult = useAuthenticatedQuery<AlertItem[]>(
    ["dashboard-alerts", ...selectedListings],
    "/dashboard/alerts",
    { enabled: !USE_MOCK },
  );

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }
  return {
    data: apiResult.data ?? [],
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useDashboardPreview(
  selectedListings: string[],
  timeframe: string,
) {
  const mockResult = useMemo(
    () =>
      computePreview(
        mockBookingList,
        mockCleaningTaskList,
        mockFinancialList,
        selectedListings,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedListings, timeframe],
  );

  const apiResult = useAuthenticatedQuery<PreviewData>(
    ["dashboard-preview", timeframe, ...selectedListings],
    `/dashboard/preview?timeframe=${timeframe}`,
    { enabled: !USE_MOCK },
  );

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }
  return {
    data: apiResult.data ?? null,
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}
