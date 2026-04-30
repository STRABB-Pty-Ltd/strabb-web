"use client";

import { useQuery } from "@tanstack/react-query";

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
  unreadMessages: number;
  unscheduledCleans?: number;
  urgentTickets?: number;
  syncErrors?: number;
  overdueTasks?: number;
  highPriority?: number;
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
      label: "Net Income",
      value: raw.netIncome,
      icon: "trending-up",
      trend: t?.netIncome,
      type: "currency",
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
  ];
}

function rawAlertsToAlertItems(raw: RawAlertResponse): AlertItem[] {
  // TODO: backend should return unscheduledCleans, urgentTickets, syncErrors directly.
  // overdueTasks and highPriority kept as fallbacks until backend updated.
  const unscheduled = raw.unscheduledCleans ?? raw.overdueTasks ?? 0;
  const urgent = raw.urgentTickets ?? raw.highPriority ?? 0;
  const sync = raw.syncErrors ?? 0;

  return [
    {
      id: "alert-messages",
      type: "message",
      severity: "blue",
      description: `${raw.unreadMessages} unread message${raw.unreadMessages === 1 ? "" : "s"}`,
      count: raw.unreadMessages,
    },
    {
      id: "alert-unscheduled",
      type: "unscheduled",
      severity: "amber",
      description: `${unscheduled} clean${unscheduled === 1 ? "" : "s"} need scheduling`,
      count: unscheduled,
    },
    {
      id: "alert-tickets",
      type: "ticket",
      severity: "red",
      description: `${urgent} urgent ticket${urgent === 1 ? "" : "s"}`,
      count: urgent,
    },
    {
      id: "alert-sync",
      type: "sync",
      severity: "red",
      description: `${sync} sync error${sync === 1 ? "" : "s"}`,
      count: sync,
    },
  ];
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

export interface RawPreviewResponse {
  miniCalendar: { date: string; bookings: number }[];
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

export function rawPreviewToPreviewData(raw: RawPreviewResponse): PreviewData {
  return {
    miniCalendar: raw.miniCalendar ?? [],
    revenueSparkline: (raw.revenueTrend ?? []).map((r) => ({
      label: r.month,
      revenue: r.amount,
    })),
    upcomingBookings: (raw.upcomingBookings ?? []).map((b) => ({
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
