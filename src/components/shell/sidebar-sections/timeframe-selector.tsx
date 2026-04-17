"use client";

import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

interface TimeframeOption {
  id: string;
  label: string;
}

const timeframeOptions: Record<string, TimeframeOption[]> = {
  dashboard: [
    { id: "this_month", label: "This Month" },
    { id: "last_month", label: "Last Month" },
    { id: "this_quarter", label: "This Quarter" },
    { id: "ytd", label: "YTD" },
  ],
  calendar: [
    { id: "day", label: "Day" },
    { id: "week", label: "Week" },
    { id: "fortnight", label: "Fortnight" },
    { id: "month", label: "Month" },
  ],
  cleaning: [
    { id: "today", label: "Today" },
    { id: "this_week", label: "This Week" },
    { id: "this_month", label: "This Month" },
  ],
  reporting: [
    { id: "this_month", label: "This Month" },
    { id: "last_month", label: "Last Month" },
    { id: "this_quarter", label: "This Quarter" },
    { id: "this_year", label: "This Year" },
    { id: "ytd", label: "YTD" },
  ],
};

export function TimeframeSelector({ page }: { page: PageId }) {
  const setTimeframe = useAppStore((s) => s.setTimeframe);
  const openTimeframePopup = useAppStore((s) => s.openTimeframePopup);
  const dashboardTf = useAppStore((s) => s.dashboard.timeframe);
  const calendarTf = useAppStore((s) => s.calendar.timeframe);
  const cleaningTf = useAppStore((s) => s.cleaning.timeframe);
  const reportingTf = useAppStore((s) => s.reporting.timeframe);

  const options = timeframeOptions[page];
  if (!options) return null;

  const tfByPage: Record<string, string> = {
    dashboard: dashboardTf,
    calendar: calendarTf,
    cleaning: cleaningTf,
    reporting: reportingTf,
  };
  const currentTf = tfByPage[page] ?? "";

  return (
    <div style={{ padding: "var(--space-sm)" }}>
      <h3
        className="mb-base text-body font-semibold tracking-wide uppercase"
        style={{ color: "var(--brand-10)", opacity: 0.7 }}
      >
        Timeframe
      </h3>
      <div className="grid grid-cols-2 gap-xs">
        {options.map((opt) => {
          const isActive = currentTf === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
                setTimeframe(page as "dashboard" | "calendar" | "cleaning" | "reporting", opt.id)
              }
              className="rounded-lg px-sm py-base text-body font-medium transition-colors"
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
          onClick={openTimeframePopup}
          className="col-span-2 rounded-lg px-sm py-base text-body font-medium transition-colors"
          style={{
            backgroundColor: "var(--btn-inactive-bg)",
            color: "var(--btn-inactive-text)",
          }}
        >
          Custom
        </button>
      </div>
    </div>
  );
}
