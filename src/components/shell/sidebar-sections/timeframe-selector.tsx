"use client";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

interface TimeframeOption {
  id: string;
  label: string;
}

const timeframeOptions: Record<string, TimeframeOption[]> = {
  dashboard: [
    { id: "month", label: "Month" },
    { id: "quarter", label: "Quarter" },
    { id: "year", label: "Year" },
  ],
  calendar: [
    { id: "day", label: "Day" },
    { id: "week", label: "Week" },
    { id: "fortnight", label: "Fortnight" },
    { id: "month", label: "Month" },
  ],
  operations: [
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "fortnight", label: "Fortnight" },
    { id: "month", label: "Month" },
  ],
  reporting: [
    { id: "month", label: "Month" },
    { id: "quarter", label: "Quarter" },
    { id: "ytd", label: "YTD" },
    { id: "year", label: "Year" },
  ],
};

// Cleaning's "Today" chip maps to windowSize "day" - keep the friendlier label.
const chipIdToWindowSize: Record<string, string> = {
  today: "day",
};

const windowSizeToChipId: Record<string, string> = {
  day: "today",
};

export function TimeframeSelector({ page }: { page: PageId }) {
  const setTimeframe = useAppStore((s) => s.setTimeframe);
  const openTimeframePopup = useAppStore((s) => s.openTimeframePopup);
  const dashboardWs = useAppStore((s) => s.dashboard.windowSize);
  const calendarWs = useAppStore((s) => s.calendar.windowSize);
  const operationsWs = useAppStore((s) => s.operations.windowSize);
  const reportingWs = useAppStore((s) => s.reporting.windowSize);

  const options = timeframeOptions[page];
  if (!options) return null;

  const wsByPage: Record<string, string> = {
    dashboard: dashboardWs,
    calendar: calendarWs,
    operations: operationsWs,
    reporting: reportingWs,
  };
  const currentWs = wsByPage[page] ?? "";
  const activeChipId =
    page === "operations" ? (windowSizeToChipId[currentWs] ?? currentWs) : currentWs;

  return (
    <div className="p-sm">
      <h3
        className="mb-base text-body font-semibold tracking-wide uppercase"
        style={{ color: "var(--text-secondary)" }}
      >
        Timeframe
      </h3>
      <div className="gap-xs grid grid-cols-2">
        {options.map((opt) => {
          const isActive = activeChipId === opt.id;
          const targetWindowSize = chipIdToWindowSize[opt.id] ?? opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isActive}
              aria-haspopup="dialog"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTimeframe(
                  page as "dashboard" | "calendar" | "operations" | "reporting",
                  targetWindowSize,
                  null,
                );
                // Window changed → 5s grace period for picking a specific period.
                // Same chip clicked again → no timer, popup stays for browsing.
                openTimeframePopup({
                  autoSelect: !isActive,
                  anchor: {
                    top: rect.top,
                    left: rect.left,
                    bottom: rect.bottom,
                    right: rect.right,
                  },
                });
              }}
              className={cn(
                "px-sm py-base text-body rounded-lg font-medium transition-colors",
                isActive ? "bg-highlight-10 text-surface-60" : "bg-neutral-30 text-highlight-10",
              )}
            >
              {opt.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={currentWs === "custom"}
          aria-haspopup="dialog"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const wasCustom = currentWs === "custom";
            setTimeframe(
              page as "dashboard" | "calendar" | "operations" | "reporting",
              "custom",
              null,
            );
            openTimeframePopup({
              autoSelect: !wasCustom,
              anchor: {
                top: rect.top,
                left: rect.left,
                bottom: rect.bottom,
                right: rect.right,
              },
            });
          }}
          className={cn(
            "px-sm py-base text-body rounded-lg font-medium transition-colors",
            page === "dashboard" ? "" : "col-span-2",
            currentWs === "custom"
              ? "bg-highlight-10 text-surface-60"
              : "bg-neutral-30 text-highlight-10",
          )}
        >
          Custom
        </button>
      </div>
    </div>
  );
}
