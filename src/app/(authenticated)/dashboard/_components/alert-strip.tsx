"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, MessageSquare, RefreshCw, Wrench, X } from "lucide-react";

import type { AlertItem } from "@/hooks/use-dashboard";
import { useAppStore } from "@/stores/app-store";

const severityBg: Record<string, string> = {
  red: "var(--neutral-30)",
  amber: "var(--neutral-30)",
  blue: "var(--neutral-30)",
};

const severityAccent: Record<string, string> = {
  red: "var(--status-issues)",
  amber: "var(--status-issues)",
  blue: "var(--brand-10)",
};

const typeIcon: Record<string, React.ElementType> = {
  message: MessageSquare,
  unscheduled: CalendarClock,
  ticket: Wrench,
  sync: RefreshCw,
};

interface AlertStripProps {
  alerts: AlertItem[];
}

export function AlertStrip({ alerts }: AlertStripProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const setSubmenu = useAppStore((s) => s.setSubmenu);
  const router = useRouter();

  const handleView = (alert: AlertItem) => {
    switch (alert.type) {
      case "message":
        setSubmenu("messaging", ["unread"]);
        router.push("/messaging");
        return;
      case "unscheduled":
        setSubmenu("cleaning", ["pending"]);
        router.push("/cleaning");
        return;
      case "ticket":
        router.push("/cleaning/tickets");
        return;
      case "sync":
        router.push("/settings/admin");
        return;
    }
  };

  const visible = alerts.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="gap-sm grid grid-cols-12">
      {visible.map((alert) => {
        const Icon = typeIcon[alert.type] ?? AlertTriangle;
        const bg = severityBg[alert.severity] ?? "var(--neutral-30)";
        const accent = severityAccent[alert.severity] ?? "var(--brand-10)";
        return (
          <div
            key={alert.id}
            className="gap-sm px-md py-sm col-span-3 flex items-center rounded-lg transition-shadow hover:shadow-md"
            style={{ backgroundColor: bg }}
          >
            <Icon size={16} style={{ color: accent }} />
            <span className="text-body flex-1" style={{ color: "var(--brand-10)" }}>
              {alert.description}
            </span>
            <button
              type="button"
              onClick={() => handleView(alert)}
              className="text-body cursor-pointer font-semibold whitespace-nowrap"
              style={{ color: accent }}
              data-no-elevate
            >
              View
            </button>
            <button
              type="button"
              onClick={() => setDismissed((d) => [...d, alert.id])}
              style={{ color: "var(--brand-10)", opacity: 0.6 }}
              data-no-elevate
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
