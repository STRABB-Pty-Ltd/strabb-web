"use client";

import { useQuery } from "@tanstack/react-query";
import { addDays, format, startOfDay } from "date-fns";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import { timeframeToDateRange } from "@/lib/timeframe-utils";
import type { KPIData, AlertItem, PreviewData } from "@/lib/mock-data/dashboard-hooks";

interface RawKPIMetrics {
  revenue: number;
  expenses: number;
  netIncome: number;
  occupancyRate: number;
  avgNightlyRate: number;
  totalBookings: number;
}

interface RawKPITrends {
  revenue: number | null;
  expenses: number | null;
  netIncome: number | null;
  occupancyRate: number | null;
  avgNightlyRate: number | null;
  totalBookings: number | null;
}

interface RawKPIResponse extends RawKPIMetrics {
  previous?: RawKPIMetrics;
  trends?: RawKPITrends;
}

interface RawAlertResponse {
  overdueTasks: number;
  blockedTasks: number;
  unreadMessages: number;
  highPriority: number;
}

function rawKPIsToKPIData(raw: RawKPIResponse): KPIData[] {
  const t = raw.trends;
  return [
    {
      label: "Total Revenue",
      value: raw.revenue,
      icon: "dollar-sign",
      trend: t?.revenue,
      type: "currency",
    },
    {
      label: "Total Bookings",
      value: raw.totalBookings,
      icon: "calendar",
      trend: t?.totalBookings,
      type: "number",
    },
    {
      label: "Avg Occupancy",
      value: Math.round(raw.occupancyRate * 100),
      icon: "percent",
      trend: t?.occupancyRate,
      type: "percentage",
    },
    {
      label: "Avg Nightly Rate",
      value: Math.round(raw.avgNightlyRate),
      icon: "bed",
      trend: t?.avgNightlyRate,
      type: "currency",
    },
    {
      label: "Net Income",
      value: raw.netIncome,
      icon: "trending-up",
      trend: t?.netIncome,
      type: "currency",
    },
    {
      label: "Expenses",
      value: raw.expenses,
      icon: "receipt",
      trend: t?.expenses,
      type: "currency",
    },
  ];
}

function rawAlertsToAlertItems(raw: RawAlertResponse): AlertItem[] {
  const alerts: AlertItem[] = [];
  if (raw.unreadMessages > 0) {
    alerts.push({
      id: "alert-messages",
      type: "message",
      severity: "blue",
      description: `${raw.unreadMessages} unread message${raw.unreadMessages > 1 ? "s" : ""} requiring attention`,
      count: raw.unreadMessages,
    });
  }
  if (raw.overdueTasks > 0) {
    alerts.push({
      id: "alert-overdue",
      type: "overdue",
      severity: "amber",
      description: `${raw.overdueTasks} cleaning task${raw.overdueTasks > 1 ? "s" : ""} overdue`,
      count: raw.overdueTasks,
    });
  }
  if (raw.highPriority > 0) {
    alerts.push({
      id: "alert-priority",
      type: "conflict",
      severity: "red",
      description: `${raw.highPriority} high priority item${raw.highPriority > 1 ? "s" : ""}`,
      count: raw.highPriority,
    });
  }
  return alerts;
}

export function useDashboardKPIsAPI(
  windowSize: string,
  anchor: string | null,
  selectedListings: string[],
) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const { startDate, endDate } = timeframeToDateRange(windowSize, anchor);
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  params.set("start_date", startDate);
  params.set("end_date", endDate);

  return useQuery<KPIData[]>({
    queryKey: ["dashboard-kpis", windowSize, anchor ?? "now", ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawKPIResponse }>(
        `/dashboard/kpis?${params.toString()}`,
      );
      return rawKPIsToKPIData(response.data);
    },
    enabled: !USE_MOCK && isReady,
  });
}

export function useDashboardAlertsAPI(selectedListings: string[]) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<AlertItem[]>({
    queryKey: ["dashboard-alerts", ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawAlertResponse }>("/dashboard/alerts");
      return rawAlertsToAlertItems(response.data);
    },
    enabled: !USE_MOCK && isReady,
  });
}

interface RawPreviewResponse {
  revenueTrend: { month: string; amount: number }[];
  upcomingBookings: {
    id: string;
    listingName: string;
    guestName: string;
    checkIn: string;
    channel: string;
  }[];
  cleaningStatus: Record<string, number>;
  channelBreakdown: { channel: string; count: number; revenue: number }[];
}

const statusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  inProgress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  issues: "var(--status-issues)",
};

function rawPreviewToPreviewData(raw: RawPreviewResponse): PreviewData {
  // Backend doesn't return a per-day mini-calendar; derive one from the
  // upcoming-bookings list by counting check-ins per day for the next 7 days.
  // Approximate (only counts check-ins, not bookings already in progress)
  // until the API exposes a dedicated booking-density endpoint.
  const today = startOfDay(new Date());
  const upcoming = raw.upcomingBookings ?? [];
  const miniCalendar = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i);
    const dayStr = format(day, "yyyy-MM-dd");
    const bookings = upcoming.filter((b) => b.checkIn.split("T")[0] === dayStr).length;
    return { date: dayStr, bookings };
  });

  return {
    miniCalendar,
    revenueSparkline: (raw.revenueTrend ?? []).map((r) => ({
      label: r.month,
      revenue: r.amount,
    })),
    upcomingBookings: upcoming.map((b) => ({
      id: b.id,
      guest: b.guestName,
      listing: b.listingName,
      checkIn: b.checkIn,
      channel: b.channel,
    })),
    taskSummary: Object.entries(raw.cleaningStatus ?? {}).map(([status, count]) => ({
      status,
      count,
      color: statusColors[status] ?? "var(--brand-10)",
    })),
  };
}

export function useDashboardPreviewAPI(
  selectedListings: string[],
  windowSize: string,
  anchor: string | null,
) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const { startDate, endDate } = timeframeToDateRange(windowSize, anchor);
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  params.set("start_date", startDate);
  params.set("end_date", endDate);

  return useQuery<PreviewData>({
    queryKey: ["dashboard-preview", windowSize, anchor ?? "now", ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawPreviewResponse }>(
        `/dashboard/preview?${params.toString()}`,
      );
      return rawPreviewToPreviewData(response.data);
    },
    enabled: !USE_MOCK && isReady,
  });
}

export function useDashboardCompareAPI(
  selectedListings: string[],
  windowSize: string,
  anchor: string | null,
) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const { startDate, endDate } = timeframeToDateRange(windowSize, anchor);
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  params.set("start_date", startDate);
  params.set("end_date", endDate);

  return useQuery({
    queryKey: ["dashboard-compare", windowSize, anchor ?? "now", ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: unknown }>(
        `/dashboard/compare?${params.toString()}`,
      );
      return response.data;
    },
    enabled: !USE_MOCK && isReady && selectedListings.length > 0,
  });
}
