"use client";

import { useDashboardAlerts, useDashboardKPIs, useDashboardPreview } from "@/hooks/use-dashboard";
import { useAppStore } from "@/stores/app-store";

import { AlertStrip } from "@/components/pages/dashboard/alert-strip";
import { ComparePanel } from "@/components/pages/dashboard/compare-panel";
import { KPIGrid } from "@/components/pages/dashboard/kpi-grid";
import { PreviewGrid } from "@/components/pages/dashboard/preview-grid";

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
      <div className="py-xl flex items-center justify-center">
        <p className="text-body text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <KPIGrid kpis={kpis} compareKpis={isCompare ? kpis : undefined} />

      {alerts && alerts.length > 0 && <AlertStrip alerts={alerts} />}

      {isCompare && <ComparePanel current={kpis} comparison={kpis} />}

      <PreviewGrid data={preview} />
    </div>
  );
}
