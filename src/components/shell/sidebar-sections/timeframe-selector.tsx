"use client";

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
    { id: "ytd", label: "YTD" },
    { id: "year", label: "Year" },
  ],
  calendar: [
    { id: "day", label: "Day" },
    { id: "week", label: "Week" },
    { id: "fortnight", label: "Fortnight" },
    { id: "month", label: "Month" },
  ],
  cleaning: [
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
  const cleaningWs = useAppStore((s) => s.cleaning.windowSize);
  const reportingWs = useAppStore((s) => s.reporting.windowSize);

  const options = timeframeOptions[page];
  if (!options) return null;

  const wsByPage: Record<string, string> = {
    dashboard: dashboardWs,
    calendar: calendarWs,
    cleaning: cleaningWs,
    reporting: reportingWs,
  };
  const currentWs = wsByPage[page] ?? "";
  const activeChipId =
    page === "cleaning" ? (windowSizeToChipId[currentWs] ?? currentWs) : currentWs;

  return (
    <div style={{ padding: "var(--space-sm)" }}>
      <h3
        className="mb-base text-body font-semibold tracking-wide uppercase"
        style={{ color: "var(--brand-10)", opacity: 0.7 }}
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
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTimeframe(
                  page as "dashboard" | "calendar" | "cleaning" | "reporting",
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
              className="px-sm py-base text-body rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: isActive ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
                color: isActive ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const wasCustom = currentWs === "custom";
            setTimeframe(
              page as "dashboard" | "calendar" | "cleaning" | "reporting",
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
          className="px-sm py-base text-body col-span-2 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor:
              currentWs === "custom" ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
            color: currentWs === "custom" ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
          }}
        >
          Custom
        </button>
      </div>
    </div>
  );
}
