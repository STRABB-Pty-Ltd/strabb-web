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
    <div className="border-b" style={{ padding: "var(--space-md)", borderColor: "var(--border)" }}>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
        Timeframe
      </h3>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const isActive = currentTf === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
                setTimeframe(
                  page as "dashboard" | "calendar" | "cleaning" | "reporting",
                  opt.id,
                )
              }
              className="rounded-full px-3 py-1 text-xs transition-colors"
              style={
                isActive
                  ? {
                      backgroundColor: "var(--strabb-secondary)",
                      color: "white",
                    }
                  : {
                      backgroundColor: "#F3F4F6",
                      color: "#374151",
                    }
              }
            >
              {opt.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={openTimeframePopup}
          className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-500"
        >
          Custom
        </button>
      </div>
    </div>
  );
}
