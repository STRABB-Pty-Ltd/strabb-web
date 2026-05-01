"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardAlerts, useDashboardKPIs, useDashboardPreview } from "@/hooks/use-dashboard";
import { useAppStore } from "@/stores/app-store";

import { AlertStrip } from "./_components/alert-strip";
import { ComparePanel } from "./_components/compare-panel";
import { KPIGrid } from "./_components/kpi-grid";
import { PreviewGrid } from "./_components/preview-grid";

export default function DashboardPage() {
  const windowSize = useAppStore((s) => s.dashboard.windowSize);
  const anchor = useAppStore((s) => s.dashboard.anchor);
  const submenu = useAppStore((s) => s.dashboard.submenu);
  const compare = useAppStore((s) => s.dashboard.compare);
  const selectedListings = useAppStore((s) => s.selectedListings);

  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs(
    windowSize,
    anchor,
    selectedListings,
  );
  const { data: alerts } = useDashboardAlerts(selectedListings);
  const { data: preview, isLoading: previewLoading } = useDashboardPreview(
    selectedListings,
    windowSize,
    anchor,
  );

  const isCompare = compare || submenu.includes("compare");

  if (kpisLoading || previewLoading || !kpis || !preview) {
    return (
      <div className="space-y-sm" aria-busy="true">
        <span className="sr-only">Loading dashboard</span>
        <div className="gap-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
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

      <KPIGrid kpis={kpis} compareKpis={isCompare ? kpis : undefined} />

      {isCompare && <ComparePanel current={kpis} comparison={kpis} />}

      <PreviewGrid data={preview} windowSize={windowSize} />
    </div>
  );
}
