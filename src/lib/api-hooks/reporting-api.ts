"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import { timeframeToDateRange } from "@/lib/timeframe-utils";
import type { ReportingKPI, ChartDataSet } from "@/lib/mock-data/reporting-hooks";

interface RawFinancial {
  month: string;
  listingId: string;
  listingName: string;
  revenue: number;
  cleaningCost: number;
  maintenanceCost: number;
  suppliesCost: number;
  platformFees: number;
  netIncome: number;
  occupancyRate: number;
  avgNightlyRate: number;
  bookingCount: number;
}

interface RawOccupancy {
  listingName: string;
  occupancyRate: number;
}

interface RawRevenueBreakdown {
  listingName: string;
  channel: string;
  revenue: number;
}

interface RawExpense {
  category: string;
  amount: number;
}

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  bookingCom: "var(--channel-booking)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

function rawFinancialsToKPIs(rows: RawFinancial[]): ReportingKPI[] {
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalExpenses = rows.reduce(
    (s, r) => s + r.cleaningCost + r.maintenanceCost + r.suppliesCost + r.platformFees,
    0,
  );
  const totalNet = rows.reduce((s, r) => s + r.netIncome, 0);
  const avgOccupancy =
    rows.length > 0
      ? Math.round((rows.reduce((s, r) => s + r.occupancyRate, 0) / rows.length) * 100)
      : 0;
  const avgRate =
    rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.avgNightlyRate, 0) / rows.length) : 0;
  const totalBookings = rows.reduce((s, r) => s + r.bookingCount, 0);

  return [
    {
      label: "Total Revenue",
      value: totalRevenue,
      icon: "dollar-sign",
      trend: 0,
      type: "currency",
    },
    { label: "Net Income", value: totalNet, icon: "trending-up", trend: 0, type: "currency" },
    { label: "Total Expenses", value: totalExpenses, icon: "receipt", trend: 0, type: "currency" },
    { label: "Avg Occupancy", value: avgOccupancy, icon: "percent", trend: 0, type: "percentage" },
    { label: "Avg Nightly Rate", value: avgRate, icon: "bed", trend: 0, type: "currency" },
    { label: "Total Bookings", value: totalBookings, icon: "calendar", trend: 0, type: "number" },
  ];
}

export function useReportingKPIsAPI(selectedListings: string[], timeframe?: string) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const { startDate, endDate } = timeframeToDateRange(timeframe ?? "this_month");
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  params.set("start_date", startDate);
  params.set("end_date", endDate);

  return useQuery<ReportingKPI[]>({
    queryKey: ["reporting-kpis", startDate, endDate, ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawFinancial[] }>(
        `/reporting/financials?${params.toString()}`,
      );
      return rawFinancialsToKPIs(response.data);
    },
    enabled: !USE_MOCK && isReady,
  });
}

export function useReportingChartDataAPI(selectedListings: string[], timeframe?: string) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const { startDate, endDate } = timeframeToDateRange(timeframe ?? "this_month");
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  params.set("start_date", startDate);
  params.set("end_date", endDate);

  return useQuery<ChartDataSet>({
    queryKey: ["reporting-charts", startDate, endDate, ...selectedListings],
    queryFn: async () => {
      const [occupancyRes, revenueRes, expensesRes] = await Promise.all([
        apiClient.get<{ data: RawOccupancy[] }>(`/reporting/occupancy?${params.toString()}`),
        apiClient.get<{ data: RawRevenueBreakdown[] }>(
          `/reporting/revenue-breakdown?${params.toString()}`,
        ),
        apiClient.get<{ data: RawExpense[] }>(`/reporting/expense-breakdown?${params.toString()}`),
      ]);

      // Build occupancy by listing
      const occupancy = occupancyRes.data.map((o) => ({
        listing: o.listingName,
        occupancy: Math.round(o.occupancyRate * 100),
      }));

      // Build channel breakdown and revenue by listing
      const channelMap = new Map<string, { revenue: number }>();
      const listingMap = new Map<string, { revenue: number }>();
      for (const r of revenueRes.data) {
        const ch = channelMap.get(r.channel) ?? { revenue: 0 };
        ch.revenue += r.revenue;
        channelMap.set(r.channel, ch);
        const lm = listingMap.get(r.listingName) ?? { revenue: 0 };
        lm.revenue += r.revenue;
        listingMap.set(r.listingName, lm);
      }
      const totalChannelRevenue = [...channelMap.values()].reduce((s, c) => s + c.revenue, 0);
      const channelBreakdown = [...channelMap.entries()].map(([channel, { revenue }]) => ({
        channel,
        revenue,
        percentage: totalChannelRevenue > 0 ? Math.round((revenue / totalChannelRevenue) * 100) : 0,
        color: channelColors[channel] ?? "var(--channel-direct)",
      }));
      const revenueByListing = [...listingMap.entries()].map(([listing, { revenue }]) => ({
        listing,
        revenue,
        color: "var(--brand-10)",
      }));

      const expenses = expensesRes.data.map((e) => ({
        category: e.category,
        amount: e.amount,
      }));

      return {
        revenueTrend: [],
        channelBreakdown,
        occupancy,
        expenses,
        revenueByListing,
      } as ChartDataSet;
    },
    enabled: !USE_MOCK && isReady,
  });
}

export interface SavedReportPayload {
  name: string;
  timeframe: string;
  submenu: string[];
}

export function useSavedReportsAPI() {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<SavedReportPayload[]>({
    queryKey: ["saved-reports"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: SavedReportPayload[] }>("/saved-reports");
      return response.data;
    },
    enabled: !USE_MOCK && isReady,
  });
}

export function useCreateSavedReportAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SavedReportPayload) => apiClient.post("/saved-reports", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-reports"] });
    },
  });
}

export function useUpdateSavedReportAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SavedReportPayload }) =>
      apiClient.put(`/saved-reports/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-reports"] });
    },
  });
}

export function useDeleteSavedReportAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/saved-reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-reports"] });
    },
  });
}
