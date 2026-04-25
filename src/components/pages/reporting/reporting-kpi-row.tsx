"use client";

import { KPICard } from "@/components/pages/dashboard/kpi-card";
import type { KPIData } from "@/hooks/use-dashboard";
import type { ReportingKPI } from "@/hooks/use-reporting";
import { useAppStore } from "@/stores/app-store";

interface ReportingKPIRowProps {
  kpis: ReportingKPI[];
}

export function ReportingKPIRow({ kpis }: ReportingKPIRowProps) {
  const setDrillDown = useAppStore((s) => s.setDrillDown);

  return (
    <div className="gap-sm grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => {
        const kpiData: KPIData = {
          label: kpi.label,
          value: kpi.value,
          icon: kpi.icon,
          trend: kpi.trend,
          type: kpi.type,
        };
        return (
          <KPICard
            key={kpi.label}
            kpi={kpiData}
            onClick={() => setDrillDown({ type: "kpi", itemId: kpi.label, label: kpi.label })}
          />
        );
      })}
    </div>
  );
}
