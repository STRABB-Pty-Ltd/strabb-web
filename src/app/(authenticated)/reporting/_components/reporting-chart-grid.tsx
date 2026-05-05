"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import type { ChartDataSet } from "@/hooks/use-reporting";

// Lazy-load recharts-backed charts so the ~50KB recharts bundle only ships
// when /reporting is actually rendered. Each chart pulls its own slice.
// ssr: false because charts depend on window measurements via
// ResponsiveContainer; a Skeleton at the same height reserves space to
// avoid CLS while the chunk is fetched.
const chartLoading = <Skeleton className="w-full" h={377} />;

const RevenueTrendChart = dynamic(
  () =>
    import("@/components/charts/revenue-trend-chart").then((m) => ({
      default: m.RevenueTrendChart,
    })),
  { ssr: false, loading: () => chartLoading },
);
const ChannelBreakdownChart = dynamic(
  () =>
    import("@/components/charts/channel-breakdown-chart").then((m) => ({
      default: m.ChannelBreakdownChart,
    })),
  { ssr: false, loading: () => chartLoading },
);
const OccupancyChart = dynamic(
  () =>
    import("@/components/charts/occupancy-chart").then((m) => ({
      default: m.OccupancyChart,
    })),
  { ssr: false, loading: () => chartLoading },
);
const ExpenseChart = dynamic(
  () =>
    import("@/components/charts/expense-chart").then((m) => ({
      default: m.ExpenseChart,
    })),
  { ssr: false, loading: () => chartLoading },
);
const RevenueByListingChart = dynamic(
  () =>
    import("@/components/charts/revenue-by-listing-chart").then((m) => ({
      default: m.RevenueByListingChart,
    })),
  { ssr: false, loading: () => chartLoading },
);

interface ReportingChartGridProps {
  activeSubmenu: string[];
  data: ChartDataSet;
}

export function ReportingChartGrid({ activeSubmenu, data }: ReportingChartGridProps) {
  const showOverview = activeSubmenu.length === 0 || activeSubmenu.includes("overview");
  const showRevenue = activeSubmenu.includes("revenue");
  const showExpenses = activeSubmenu.includes("expenses");
  const showBookings = activeSubmenu.includes("bookings");

  if (showOverview) {
    return (
      <div className="gap-sm grid grid-cols-1 lg:grid-cols-2">
        <RevenueTrendChart data={data.revenueTrend} />
        <ChannelBreakdownChart data={data.channelBreakdown} />
        <OccupancyChart data={data.occupancy} />
        <ExpenseChart data={data.expenses} />
      </div>
    );
  }

  if (showRevenue) {
    return (
      <div className="space-y-sm">
        <RevenueTrendChart data={data.revenueTrend} />
        <RevenueByListingChart data={data.revenueByListing} />
      </div>
    );
  }

  if (showExpenses) {
    return (
      <div className="space-y-sm">
        <ExpenseChart data={data.expenses} />
        <RevenueByListingChart
          data={data.revenueByListing.map((d) => ({
            ...d,
            revenue: Math.round(d.revenue * 0.25),
          }))}
        />
      </div>
    );
  }

  if (showBookings) {
    return (
      <div>
        <ChannelBreakdownChart data={data.channelBreakdown} />
      </div>
    );
  }

  return (
    <div className="gap-sm grid grid-cols-1 lg:grid-cols-2">
      <RevenueTrendChart data={data.revenueTrend} />
      <ChannelBreakdownChart data={data.channelBreakdown} />
    </div>
  );
}
