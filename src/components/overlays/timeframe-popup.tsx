"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { useAppStore } from "@/stores/app-store";

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function TimeframePopup() {
  const tfPopup = useAppStore((s) => s.tfPopup);
  const closeTimeframePopup = useAppStore((s) => s.closeTimeframePopup);
  const calendarDate = useAppStore((s) => s.calendarDate);
  const customRange = useAppStore((s) => s.customRange);
  const setCustomRange = useAppStore((s) => s.setCustomRange);

  const [viewDate, setViewDate] = useState(calendarDate);
  const [localStart, setLocalStart] = useState(customRange?.start ?? "");
  const [localEnd, setLocalEnd] = useState(customRange?.end ?? "");

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTimeframePopup();
    },
    [closeTimeframePopup],
  );

  useEffect(() => {
    if (tfPopup.open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [tfPopup.open, handleKeyDown]);

  if (!tfPopup.open) return null;

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const handleApplyCustom = () => {
    if (localStart && localEnd) {
      setCustomRange({ start: localStart, end: localEnd });
      closeTimeframePopup();
    }
  };

  return (
    <div
      className="fixed z-[160] rounded-xl border bg-white shadow-xl"
      style={{
        top: 144,
        left: `calc(var(--sidebar-width) + 8px)`,
        width: 377,
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="px-sm py-base flex items-center justify-between border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="gap-base flex items-center">
          <button
            type="button"
            onClick={() => setViewDate(subMonths(viewDate, 1))}
            className="p-xs rounded hover:bg-gray-100"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-body font-semibold">{format(viewDate, "MMMM yyyy")}</span>
          <button
            type="button"
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="p-xs rounded hover:bg-gray-100"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={closeTimeframePopup}
          className="p-xs rounded text-gray-400 hover:bg-gray-100"
        >
          <X size={16} />
        </button>
      </div>

      {/* Mini calendar */}
      <div className="p-sm">
        <div className="mb-xs gap-xs grid grid-cols-7">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-body text-center text-gray-400">
              {d}
            </div>
          ))}
        </div>
        <div className="gap-xs grid grid-cols-7">
          {gridDays.map((day) => {
            const inMonth = isSameMonth(day, viewDate);
            const isSelected = isSameDay(day, calendarDate);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => {
                  closeTimeframePopup();
                }}
                className="h-lg text-body flex items-center justify-center rounded transition-colors hover:bg-blue-50"
                style={{
                  color: inMonth ? "var(--brand-10)" : "var(--neutral-30)",
                  backgroundColor: isSelected ? "var(--strabb-secondary)" : undefined,
                  ...(isSelected ? { color: "var(--surface-60)" } : {}),
                }}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom range */}
      <div className="px-sm py-base border-t" style={{ borderColor: "var(--border)" }}>
        <p className="mb-xs text-body font-medium text-gray-500">Custom Range</p>
        <div className="gap-base flex items-center">
          <input
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            className="px-base py-xs text-body flex-1 rounded border"
          />
          <span className="text-body text-gray-400">to</span>
          <input
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="px-base py-xs text-body flex-1 rounded border"
          />
        </div>
        <button
          type="button"
          onClick={handleApplyCustom}
          className="mt-base py-xs text-body w-full rounded-lg text-white"
          style={{ backgroundColor: "var(--strabb-secondary)" }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
