"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import { buildKPICards, REPORTING_KPI_CARDS, type RawKPIReport } from "@/lib/api-hooks/kpi-cards";
import { formatChannel } from "@/lib/channels";
import { occupancyRateToPercent } from "@/lib/percent";
import { timeframeToDateRange, trendDateRange } from "@/lib/timeframe-utils";

export interface ReportingKPI {
  label: string;
  value: number;
  type: "currency" | "number" | "percentage";
  // Percentage change vs the previous period, or null when there is no prior
  // data to compare against (no arrow shown), matching the dashboard.
  trend: number | null;
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
  occupancy: { listing: string; occupancy: number; bookedDays: number; availableDays: number }[];
  expenses: { category: string; amount: number }[];
  revenueByListing: { listing: string; revenue: number; color: string }[];
  expensesByListing: { listing: string; revenue: number; color: string }[];
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
  bookedDays: number;
  availableDays: number;
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

// Map the server KPI payload onto the six reporting cards via the shared
// builder (kpi-cards.ts). No client-side re-aggregation: the api owns the
// formulas (weighted avg rate, occupancy net of owner blocks, cancelled
// costs excluded), the web just displays.
export function serverKPIsToCards(raw: RawKPIReport): ReportingKPI[] {
  return buildKPICards(raw, REPORTING_KPI_CARDS);
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
      // Server-computed totals + trends in one call (shared definition with
      // the dashboard via MetricsService). No client-side re-aggregation, so
      // the old mixed-currency summing risk is gone with it.
      const res = await apiClient.get<{ data: RawKPIReport }>(
        `/reporting/kpis?${params.toString()}`,
      );
      return serverKPIsToCards(res.data);
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
      const [occupancyRes, revenueRes, expensesRes, financialsRes, trendRes] = await Promise.all([
        apiClient.get<{ data: RawOccupancy[] }>(`/reporting/occupancy?${params.toString()}`),
        apiClient.get<{ data: RawRevenueBreakdown[] }>(
          `/reporting/revenue-breakdown?${params.toString()}`,
        ),
        apiClient.get<{ data: RawExpense[] }>(`/reporting/expense-breakdown?${params.toString()}`),
        apiClient.get<{ data: RawFinancial[] }>(`/reporting/financials?${params.toString()}`),
        apiClient.get<{ data: RawFinancial[] }>(`/reporting/financials?${trendParams.toString()}`),
      ]);

      // Build occupancy by listing. Booked/available nights ride along so the
      // chart summary can report the weighted aggregate, not a mean of rates.
      const occupancy = occupancyRes.data.map((o) => ({
        listing: o.listingName,
        occupancy: occupancyRateToPercent(o.occupancyRate),
        bookedDays: o.bookedDays,
        availableDays: o.availableDays,
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

      // Real per-listing expenses for the Expenses tab (item #11). The
      // expense-breakdown endpoint is dimensioned by category, not listing, so
      // the per-listing figures are summed from the current-period financials
      // records (cleaning + tickets + supplies + platform fees) per listing.
      const expenseListingMap = new Map<string, number>();
      for (const r of financialsRes.data) {
        const total = r.cleaningCost + r.ticketCost + r.suppliesCost + r.platformFees;
        expenseListingMap.set(r.listingName, (expenseListingMap.get(r.listingName) ?? 0) + total);
      }
      const expensesByListing = [...expenseListingMap.entries()].map(([listing, amount]) => ({
        listing,
        revenue: amount,
        color: "var(--highlight-10)",
      }));

      return {
        revenueTrend: financialsToRevenueTrend(trendRes.data),
        channelBreakdown,
        occupancy,
        expenses,
        revenueByListing,
        expensesByListing,
      } as ChartDataSet;
    },
    enabled: isReady,
  });
}

// Free-form config blob (stored in saved_reports.config_json). Carries the
// pinned reporting period so a saved report reloads the SAME month it was
// saved on, not the current one. `anchor` mirrors the store's reporting
// anchor: null = "current period" (relative), a date = that fixed period.
// `customRange` is only meaningful when timeframe === "custom".
export interface SavedReportConfig {
  anchor?: string | null;
  customRange?: { start: string; end: string } | null;
}

export interface SavedReportPayload {
  name: string;
  timeframe: string;
  submenu: string[];
  // The listing filter + pinned period captured at save time, so a saved
  // report reloads with the same listings + month (not current-month /
  // whole-portfolio). Optional so older rows without them still load.
  listingIds?: string[];
  configJson?: SavedReportConfig;
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
