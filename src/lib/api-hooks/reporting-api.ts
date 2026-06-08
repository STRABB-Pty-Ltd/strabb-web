"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import { formatChannel } from "@/lib/channels";
import { timeframeToDateRange, trendDateRange } from "@/lib/timeframe-utils";

export interface ReportingKPI {
  label: string;
  value: number;
  type: "currency" | "number" | "percentage";
  trend: number;
  icon: string;
}

export interface ChartDataSet {
  revenueTrend: { label: string; revenue: number }[];
  channelBreakdown: {
    channel: string;
    revenue: number;
    percentage: number;
    color: string;
  }[];
  occupancy: { listing: string; occupancy: number }[];
  expenses: { category: string; amount: number }[];
  revenueByListing: { listing: string; revenue: number; color: string }[];
}

export interface RawFinancial {
  month: string;
  listingId: string;
  listingName: string;
  revenue: number;
  cleaningCost: number;
  ticketCost: number;
  suppliesCost: number;
  platformFees: number;
  netIncome: number;
  occupancyRate: number;
  avgNightlyRate: number;
  bookingCount: number;
  // Total room-nights in this month/listing record. Used to compute a true
  // weighted average nightly rate (sum of revenue / sum of nights).
  nights: number;
  currency?: string;
}

interface RawOccupancy {
  listingName: string;
  occupancyRate: number;
}

interface RawRevenueBreakdown {
  listingName: string;
  channel: string;
  revenue: number;
  currency?: string;
}

interface RawExpense {
  category: string;
  amount: number;
  currency?: string;
}

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  bookingCom: "var(--channel-booking)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

export function enumerateMonths(start: string, end: string): string[] {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  if (!sy || !sm || !ey || !em) return [];
  const result: string[] = [];
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    result.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return result;
}

export function financialsToRevenueTrend(
  rows: RawFinancial[],
): { label: string; revenue: number }[] {
  const monthMap = new Map<string, number>();
  for (const r of rows) {
    monthMap.set(r.month, (monthMap.get(r.month) ?? 0) + r.revenue);
  }
  if (monthMap.size === 0) return [];
  const months = [...monthMap.keys()].sort();
  return enumerateMonths(months[0], months[months.length - 1]).map((label) => ({
    label,
    revenue: monthMap.get(label) ?? 0,
  }));
}

export function rawFinancialsToKPIs(rows: RawFinancial[]): ReportingKPI[] {
  // TODO(currency-precision): switch to server-computed totals when path A
  // migration ships (Stripe payouts / BAS exports). Per currency strategy
  // in CLAUDE.md.
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalExpenses = rows.reduce(
    (s, r) => s + r.cleaningCost + r.ticketCost + r.suppliesCost + r.platformFees,
    0,
  );
  const totalNet = rows.reduce((s, r) => s + r.netIncome, 0);
  const avgOccupancy =
    rows.length > 0
      ? Math.round((rows.reduce((s, r) => s + r.occupancyRate, 0) / rows.length) * 100)
      : 0;
  // True weighted average nightly rate: total room revenue / total room-nights
  // across the filtered set, NOT an average of each record's own average (which
  // weighted a 1-night and a 30-night record equally). 2dp to match money display.
  const totalNights = rows.reduce((s, r) => s + r.nights, 0);
  const avgRate = totalNights > 0 ? Math.round((totalRevenue / totalNights) * 100) / 100 : 0;
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
    { label: "Avg $/night", value: avgRate, icon: "bed", trend: 0, type: "currency" },
    { label: "Total Bookings", value: totalBookings, icon: "calendar", trend: 0, type: "number" },
  ];
}

export function useReportingKPIsAPI(
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

  return useQuery<ReportingKPI[]>({
    queryKey: ["reporting-kpis", startDate, endDate, ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawFinancial[] }>(
        `/reporting/financials?${params.toString()}`,
      );
      return rawFinancialsToKPIs(response.data);
    },
    enabled: isReady,
  });
}

export function useReportingChartDataAPI(
  selectedListings: string[],
  windowSize: string,
  anchor: string | null,
) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const { startDate, endDate } = timeframeToDateRange(windowSize, anchor);
  const { startDate: trendStart, endDate: trendEnd } = trendDateRange(windowSize, anchor);
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  params.set("start_date", startDate);
  params.set("end_date", endDate);

  const trendParams = new URLSearchParams();
  selectedListings.forEach((id) => trendParams.append("listing_ids", id));
  trendParams.set("start_date", trendStart);
  trendParams.set("end_date", trendEnd);

  return useQuery<ChartDataSet>({
    queryKey: ["reporting-charts", startDate, endDate, trendStart, trendEnd, ...selectedListings],
    queryFn: async () => {
      const [occupancyRes, revenueRes, expensesRes, trendRes] = await Promise.all([
        apiClient.get<{ data: RawOccupancy[] }>(`/reporting/occupancy?${params.toString()}`),
        apiClient.get<{ data: RawRevenueBreakdown[] }>(
          `/reporting/revenue-breakdown?${params.toString()}`,
        ),
        apiClient.get<{ data: RawExpense[] }>(`/reporting/expense-breakdown?${params.toString()}`),
        apiClient.get<{ data: RawFinancial[] }>(`/reporting/financials?${trendParams.toString()}`),
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
      // TODO(currency-precision): server-computed channel total when path A
      // migration ships. Per currency strategy in CLAUDE.md.
      const totalChannelRevenue = [...channelMap.values()].reduce((s, c) => s + c.revenue, 0);
      const channelBreakdown = [...channelMap.entries()].map(([channel, { revenue }]) => ({
        channel: formatChannel(channel),
        revenue,
        percentage: totalChannelRevenue > 0 ? Math.round((revenue / totalChannelRevenue) * 100) : 0,
        color: channelColors[channel] ?? "var(--channel-direct)",
      }));
      const revenueByListing = [...listingMap.entries()].map(([listing, { revenue }]) => ({
        listing,
        revenue,
        color: "var(--highlight-10)",
      }));

      const expenses = expensesRes.data.map((e) => ({
        category: e.category,
        amount: e.amount,
      }));

      return {
        revenueTrend: financialsToRevenueTrend(trendRes.data),
        channelBreakdown,
        occupancy,
        expenses,
        revenueByListing,
      } as ChartDataSet;
    },
    enabled: isReady,
  });
}

export interface SavedReportPayload {
  name: string;
  timeframe: string;
  submenu: string[];
}

// Server-persisted saved report. The id is needed to load and delete a
// report; created_at arrives camelCased via the global keysToCamel.
export interface SavedReport extends SavedReportPayload {
  id: string;
  createdAt?: string;
}

export function useSavedReportsAPI() {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<SavedReport[]>({
    queryKey: ["saved-reports"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: SavedReport[] }>("/saved-reports");
      return response.data;
    },
    enabled: isReady,
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
