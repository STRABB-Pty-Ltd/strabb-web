"use client";

import { ReportingChartGrid } from "@/components/pages/reporting/reporting-chart-grid";
import { ReportingKPIRow } from "@/components/pages/reporting/reporting-kpi-row";
import { SavedReportsDrawer } from "@/components/pages/reporting/saved-reports-drawer";
import { TimeframeStepper } from "@/components/views/timeframe-stepper";
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
      <div className="space-y-lg">
        <TimeframeStepper />
        <div className="py-xl flex items-center justify-center">
          <p className="text-body text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <TimeframeStepper />

      <ReportingKPIRow kpis={kpis ?? []} />

      {chartData && <ReportingChartGrid activeSubmenu={submenu} data={chartData} />}

      {savedReportsOpen && <SavedReportsDrawer />}
    </div>
  );
}
