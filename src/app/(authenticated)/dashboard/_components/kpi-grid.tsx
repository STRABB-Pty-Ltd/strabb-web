"use client";

import type { KPIData } from "@/hooks/use-dashboard";
import { useAppStore } from "@/stores/app-store";

import { KPICard } from "@/components/charts/kpi-card";

interface KPIGridProps {
  kpis: KPIData[];
}

export function KPIGrid({ kpis }: KPIGridProps) {
  const setDrillDown = useAppStore((s) => s.setDrillDown);

  return (
    <div className="gap-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.label}
          kpi={kpi}
          onClick={() =>
            setDrillDown({
              type: "kpi",
              itemId: kpi.label,
              label: kpi.label,
            })
          }
        />
      ))}
    </div>
  );
}
