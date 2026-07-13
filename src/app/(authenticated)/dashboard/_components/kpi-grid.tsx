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
    // 4-col gated at xl (1280px), not lg (1024px): lg is also where the
    // desktop shell's sidebar claims ~233px+, so a card jumping straight to
    // 4-per-row right at that same boundary left too little room for a
    // label like "Total Revenue" and it truncated ("Tota..."). Matches
    // ReportingKPIRow's existing pattern, which already avoids the same
    // trap with a buffer tier (grid-cols-2 lg:grid-cols-3 xl:grid-cols-6).
    <div className="gap-sm grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
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
