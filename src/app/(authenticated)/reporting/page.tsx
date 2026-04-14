"use client";

import { ReportingChartGrid } from "@/components/pages/reporting/reporting-chart-grid";
import { ReportingKPIRow } from "@/components/pages/reporting/reporting-kpi-row";
import { SavedReportsDrawer } from "@/components/pages/reporting/saved-reports-drawer";
import { useReportingChartData, useReportingKPIs } from "@/hooks/use-reporting";
import { useAppStore } from "@/stores/app-store";

export default function ReportingPage() {
  const submenu = useAppStore((s) => s.reporting.submenu);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const savedReportsOpen = useAppStore((s) => s.reporting.savedReportsOpen);

  const { data: kpis, isLoading: kpisLoading } =
    useReportingKPIs(selectedListings);
  const { data: chartData, isLoading: chartsLoading } =
    useReportingChartData(selectedListings);

  if (kpisLoading || chartsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-gray-400">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <ReportingKPIRow kpis={kpis} />

      {chartData && (
        <ReportingChartGrid activeSubmenu={submenu} data={chartData} />
      )}

      {savedReportsOpen && <SavedReportsDrawer />}
    </div>
  );
}
