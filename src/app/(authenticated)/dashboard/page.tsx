"use client";

import { AlertTriangle } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardAlerts, useDashboardKPIs, useDashboardPreview } from "@/hooks/use-dashboard";
import { DASHBOARD_KPI_CARDS } from "@/lib/api-hooks/kpi-cards";
import { useAppStore } from "@/stores/app-store";

import { AlertStrip } from "./_components/alert-strip";
import { KPIGrid } from "./_components/kpi-grid";
import { PreviewGrid } from "./_components/preview-grid";

export default function DashboardPage() {
  const windowSize = useAppStore((s) => s.dashboard.windowSize);
  const anchor = useAppStore((s) => s.dashboard.anchor);
  const selectedListings = useAppStore((s) => s.selectedListings);

  const {
    data: kpis,
    isLoading: kpisLoading,
    error: kpisError,
    refetch: refetchKpis,
  } = useDashboardKPIs(windowSize, anchor, selectedListings);
  const { data: alerts } = useDashboardAlerts(selectedListings);
  const {
    data: preview,
    isLoading: previewLoading,
    error: previewError,
    refetch: refetchPreview,
  } = useDashboardPreview(selectedListings, windowSize, anchor);

  // Surface query failures instead of looping on the loading skeleton (review
  // finding: the dashboard dropped the KPI/preview error, so a failed
  // /dashboard/kpis call - e.g. web deployed ahead of the api - rendered an
  // infinite skeleton). Mirrors the reporting page's error state.
  if ((kpisError || previewError) && (!kpis || !preview)) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load the dashboard"
        description="The dashboard service didn't respond. Retry, or check the api server if it keeps happening."
        action={{
          label: "Retry",
          onClick: () => {
            void refetchKpis();
            void refetchPreview();
          },
        }}
      />
    );
  }

  if (kpisLoading || previewLoading || !kpis || !preview) {
    return (
      <div className="space-y-sm" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading dashboard</span>
        {/* Mirrors KPIGrid: same grid, one tile per card spec. */}
        <div className="gap-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: DASHBOARD_KPI_CARDS.length }).map((_, i) => (
            <Skeleton key={i} h={89} />
          ))}
        </div>
        <div className="gap-sm grid grid-cols-1 lg:grid-cols-2">
          <Skeleton h={233} />
          <Skeleton h={233} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-sm">
      {alerts && alerts.length > 0 && <AlertStrip alerts={alerts} />}

      {alerts && alerts.length > 0 && (
        <div className="flex items-center">
          <div className="w-full" style={{ height: "2px", backgroundColor: "var(--neutral-30)" }} />
        </div>
      )}

      <KPIGrid kpis={kpis} />

      <PreviewGrid data={preview} windowSize={windowSize} />
    </div>
  );
}
