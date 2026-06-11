"use client";

import { AlertTriangle } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportingChartGrid } from "./_components/reporting-chart-grid";
import { ReportingKPIRow } from "./_components/reporting-kpi-row";
import { SavedReportsDrawer } from "./_components/saved-reports-drawer";
import { useReportingChartData, useReportingKPIs } from "@/hooks/use-reporting";
import { REPORTING_KPI_CARDS } from "@/lib/api-hooks/kpi-cards";
import { useAppStore } from "@/stores/app-store";

export default function ReportingPage() {
  const submenu = useAppStore((s) => s.reporting.submenu);
  const windowSize = useAppStore((s) => s.reporting.windowSize);
  const anchor = useAppStore((s) => s.reporting.anchor);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const savedReportsOpen = useAppStore((s) => s.reporting.savedReportsOpen);

  const {
    data: kpis,
    isLoading: kpisLoading,
    error: kpisError,
    refetch: refetchKpis,
  } = useReportingKPIs(selectedListings, windowSize, anchor);
  const {
    data: chartData,
    isLoading: chartsLoading,
    error: chartsError,
    refetch: refetchCharts,
  } = useReportingChartData(selectedListings, windowSize, anchor);

  if (kpisLoading || chartsLoading) {
    return (
      <div className="space-y-lg" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading reports</span>
        {/* Mirrors ReportingKPIRow: same grid, one tile per card spec. */}
        <div className="gap-sm grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: REPORTING_KPI_CARDS.length }).map((_, i) => (
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

  // Surface query failures instead of rendering an authenticated-but-blank
  // page (review finding: the hooks' error was never consumed, so a failed
  // /reporting/kpis call - e.g. web deployed ahead of the api - looked like
  // an empty portfolio).
  if ((kpisError || chartsError) && !kpis && !chartData) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load reporting data"
        description="The reporting service didn't respond. Retry, or check the api server if it keeps happening."
        action={{
          label: "Retry",
          onClick: () => {
            void refetchKpis();
            void refetchCharts();
          },
        }}
      />
    );
  }

  return (
    <div>
      {kpisError && !kpis ? (
        <EmptyState
          compact
          title="KPIs unavailable"
          description="The rest of the page loaded; retry to fetch the headline numbers."
          action={{ label: "Retry", onClick: () => void refetchKpis() }}
        />
      ) : (
        <ReportingKPIRow kpis={kpis ?? []} />
      )}

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
