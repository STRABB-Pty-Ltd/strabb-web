"use client";

import { useState } from "react";
import { AlertTriangle, Clock, MessageSquare, RefreshCw, X } from "lucide-react";

import type { AlertItem } from "@/hooks/use-dashboard";
import { useAppStore } from "@/stores/app-store";

const severityBorder: Record<string, string> = {
  red: "#DC2626",
  amber: "#D97706",
  blue: "#3B82F6",
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
        return (
          <div
            key={alert.id}
            className="flex shrink-0 items-center gap-3 rounded-lg border bg-white px-4 py-3"
            style={{
              borderColor: "var(--border)",
              borderLeftWidth: 4,
              borderLeftColor: severityBorder[alert.severity],
            }}
          >
            <Icon size={16} style={{ color: severityBorder[alert.severity] }} />
            <span className="text-sm text-gray-700">{alert.description}</span>
            <button
              type="button"
              onClick={() =>
                setDrillDown({
                  type: alert.type,
                  itemId: alert.id,
                  label: alert.description,
                })
              }
              className="text-xs font-medium whitespace-nowrap"
              style={{ color: "var(--strabb-secondary)" }}
            >
              View
            </button>
            <button
              type="button"
              onClick={() => setDismissed((d) => [...d, alert.id])}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
