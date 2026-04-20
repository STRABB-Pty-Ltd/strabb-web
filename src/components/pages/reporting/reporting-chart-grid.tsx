"use client";

import { ChannelBreakdownChart } from "@/components/charts/channel-breakdown-chart";
import { ExpenseChart } from "@/components/charts/expense-chart";
import { OccupancyChart } from "@/components/charts/occupancy-chart";
import { RevenueByListingChart } from "@/components/charts/revenue-by-listing-chart";
import { RevenueTrendChart } from "@/components/charts/revenue-trend-chart";
import type { ChartDataSet } from "@/hooks/use-reporting";

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
