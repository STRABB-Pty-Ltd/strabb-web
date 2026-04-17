"use client";

import { useState } from "react";
import { AlertTriangle, Clock, MessageSquare, RefreshCw, X } from "lucide-react";

import type { AlertItem } from "@/hooks/use-dashboard";
import { useAppStore } from "@/stores/app-store";

const severityBg: Record<string, string> = {
  red: "var(--alert-danger-bg)",
  amber: "var(--alert-danger-bg)",
  blue: "var(--alert-info-bg)",
};

const severityAccent: Record<string, string> = {
  red: "var(--status-issues)",
  amber: "var(--status-issues)",
  blue: "var(--brand-10)",
};

const typeIcon: Record<string, React.ElementType> = {
  conflict: AlertTriangle,
  overdue: Clock,
  message: MessageSquare,
  sync: RefreshCw,
};

interface AlertStripProps {
  alerts: AlertItem[];
}

export function AlertStrip({ alerts }: AlertStripProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const setDrillDown = useAppStore((s) => s.setDrillDown);

  const visible = alerts.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {visible.map((alert) => {
        const Icon = typeIcon[alert.type] ?? AlertTriangle;
        const bg = severityBg[alert.severity] ?? "var(--alert-info-bg)";
        const accent = severityAccent[alert.severity] ?? "var(--brand-10)";
        return (
          <div
            key={alert.id}
            className="flex shrink-0 items-center gap-3 rounded-lg px-4 py-3"
            style={{ backgroundColor: bg }}
          >
            <Icon size={16} style={{ color: accent }} />
            <span className="text-sm" style={{ color: "var(--brand-10)" }}>
              {alert.description}
            </span>
            <button
              type="button"
              onClick={() =>
                setDrillDown({
                  type: alert.type,
                  itemId: alert.id,
                  label: alert.description,
                })
              }
              className="text-xs font-semibold whitespace-nowrap"
              style={{ color: accent }}
            >
              View
            </button>
            <button
              type="button"
              onClick={() => setDismissed((d) => [...d, alert.id])}
              style={{ color: "var(--brand-10)", opacity: 0.6 }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
