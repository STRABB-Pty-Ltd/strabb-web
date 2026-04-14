"use client";

import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import { timeframeToDateRange } from "@/lib/timeframe-utils";
import type { KPIData, AlertItem, PreviewData } from "@/lib/mock-data/dashboard-hooks";

interface RawKPIResponse {
  revenue: number;
  expenses: number;
  netIncome: number;
  occupancyRate: number;
  avgNightlyRate: number;
  totalBookings: number;
}

interface RawAlertResponse {
  overdueTasks: number;
  blockedTasks: number;
  unreadMessages: number;
  highPriority: number;
}

function rawKPIsToKPIData(raw: RawKPIResponse): KPIData[] {
  return [
    { label: "Total Revenue", value: raw.revenue, icon: "dollar-sign", trend: 0, type: "currency" },
    { label: "Total Bookings", value: raw.totalBookings, icon: "calendar", trend: 0, type: "number" },
    { label: "Avg Occupancy", value: Math.round(raw.occupancyRate * 100), icon: "percent", trend: 0, type: "percentage" },
    { label: "Avg Nightly Rate", value: Math.round(raw.avgNightlyRate), icon: "bed", trend: 0, type: "currency" },
    { label: "Net Income", value: raw.netIncome, icon: "trending-up", trend: 0, type: "currency" },
    { label: "Expenses", value: raw.expenses, icon: "receipt", trend: 0, type: "currency" },
  ];
}

function rawAlertsToAlertItems(raw: RawAlertResponse): AlertItem[] {
  const alerts: AlertItem[] = [];
  if (raw.unreadMessages > 0) {
    alerts.push({ id: "alert-messages", type: "message", severity: "blue", description: `${raw.unreadMessages} unread message${raw.unreadMessages > 1 ? "s" : ""} requiring attention`, count: raw.unreadMessages });
  }
  if (raw.overdueTasks > 0) {
    alerts.push({ id: "alert-overdue", type: "overdue", severity: "amber", description: `${raw.overdueTasks} cleaning task${raw.overdueTasks > 1 ? "s" : ""} overdue`, count: raw.overdueTasks });
  }
  if (raw.highPriority > 0) {
    alerts.push({ id: "alert-priority", type: "conflict", severity: "red", description: `${raw.highPriority} high priority item${raw.highPriority > 1 ? "s" : ""}`, count: raw.highPriority });
  }
  return alerts;
}

export function useDashboardKPIsAPI(timeframe: string, selectedListings: string[]) {
  const apiClient = useApiClient();
  const { startDate, endDate } = timeframeToDateRange(timeframe);
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  params.set("start_date", startDate);
  params.set("end_date", endDate);

  return useQuery<KPIData[]>({
    queryKey: ["dashboard-kpis", timeframe, ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawKPIResponse }>(`/dashboard/kpis?${params.toString()}`);
      return rawKPIsToKPIData(response.data);
    },
    enabled: !USE_MOCK,
  });
}

export function useDashboardAlertsAPI(selectedListings: string[]) {
  const apiClient = useApiClient();

  return useQuery<AlertItem[]>({
    queryKey: ["dashboard-alerts", ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawAlertResponse }>("/dashboard/alerts");
      return rawAlertsToAlertItems(response.data);
    },
    enabled: !USE_MOCK,
  });
}

interface RawPreviewResponse {
  revenueTrend: { month: string; amount: number }[];
  upcomingBookings: { id: string; listingName: string; guestName: string; checkIn: string; channel: string }[];
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
  return {
    miniCalendar: [],
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
      color: statusColors[status] ?? "#6B7280",
    })),
  };
}

export function useDashboardPreviewAPI(selectedListings: string[], timeframe: string) {
  const apiClient = useApiClient();
  const { startDate, endDate } = timeframeToDateRange(timeframe);
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  params.set("start_date", startDate);
  params.set("end_date", endDate);

  return useQuery<PreviewData>({
    queryKey: ["dashboard-preview", timeframe, ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawPreviewResponse }>(`/dashboard/preview?${params.toString()}`);
      return rawPreviewToPreviewData(response.data);
    },
    enabled: !USE_MOCK,
  });
}

export function useDashboardCompareAPI(selectedListings: string[], timeframe: string) {
  const apiClient = useApiClient();
  const { startDate, endDate } = timeframeToDateRange(timeframe);
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  params.set("start_date", startDate);
  params.set("end_date", endDate);

  return useQuery({
    queryKey: ["dashboard-compare", timeframe, ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: unknown }>(`/dashboard/compare?${params.toString()}`);
      return response.data;
    },
    enabled: !USE_MOCK && selectedListings.length > 0,
  });
}
