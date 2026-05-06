"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ReportingChartGrid } from "./_components/reporting-chart-grid";
import { ReportingKPIRow } from "./_components/reporting-kpi-row";
import { SavedReportsDrawer } from "./_components/saved-reports-drawer";
import { useReportingChartData, useReportingKPIs } from "@/hooks/use-reporting";
import { useAppStore } from "@/stores/app-store";

export default function ReportingPage() {
  const submenu = useAppStore((s) => s.reporting.submenu);
  const windowSize = useAppStore((s) => s.reporting.windowSize);
  const anchor = useAppStore((s) => s.reporting.anchor);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const savedReportsOpen = useAppStore((s) => s.reporting.savedReportsOpen);

  const { data: kpis, isLoading: kpisLoading } = useReportingKPIs(
    selectedListings,
    windowSize,
    anchor,
  );
  const { data: chartData, isLoading: chartsLoading } = useReportingChartData(
    selectedListings,
    windowSize,
    anchor,
  );

  if (kpisLoading || chartsLoading) {
    return (
      <div className="space-y-lg" aria-busy="true">
        <span className="sr-only">Loading reports</span>
        <div className="gap-sm grid grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} h={89} />
          ))}
        </div>
        <div className="gap-md grid grid-cols-1 lg:grid-cols-2">
          <Skeleton h={377} />
          <Skeleton h={377} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <ReportingKPIRow kpis={kpis ?? []} />

      {chartData && (
        <div className="mt-md">
          <ReportingChartGrid activeSubmenu={submenu} data={chartData} />
        </div>
      )}

      {savedReportsOpen && (
        <div className="mt-lg">
          <SavedReportsDrawer />
        </div>
      )}
    </div>
  );
}
