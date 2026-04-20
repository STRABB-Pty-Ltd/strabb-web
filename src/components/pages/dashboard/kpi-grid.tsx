"use client";

import type { KPIData } from "@/hooks/use-dashboard";
import { useAppStore } from "@/stores/app-store";

import { KPICard } from "./kpi-card";

interface KPIGridProps {
  kpis: KPIData[];
  compareKpis?: KPIData[];
}

export function KPIGrid({ kpis, compareKpis }: KPIGridProps) {
  const setDrillDown = useAppStore((s) => s.setDrillDown);

  return (
    <div className="gap-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi, i) => {
        const compareVal = compareKpis?.[i]?.value ?? null;
        return (
          <KPICard
            key={kpi.label}
            kpi={kpi}
            compareValue={compareVal}
            onClick={() =>
              setDrillDown({
                type: "kpi",
                itemId: kpi.label,
                label: kpi.label,
              })
            }
          />
        );
      })}
    </div>
  );
}
