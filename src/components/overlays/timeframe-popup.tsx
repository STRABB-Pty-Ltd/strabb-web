"use client";

import { useCallback, useEffect, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
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
        top: 160,
        left: `calc(var(--sidebar-width) + 8px)`,
        width: 300,
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setViewDate(subMonths(viewDate, 1))} className="rounded p-0.5 hover:bg-gray-100">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold">{format(viewDate, "MMMM yyyy")}</span>
          <button type="button" onClick={() => setViewDate(addMonths(viewDate, 1))} className="rounded p-0.5 hover:bg-gray-100">
            <ChevronRight size={16} />
          </button>
        </div>
        <button type="button" onClick={closeTimeframePopup} className="rounded p-0.5 text-gray-400 hover:bg-gray-100">
          <X size={16} />
        </button>
      </div>

      {/* Mini calendar */}
      <div className="p-3">
        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-xs text-gray-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
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
                className="flex h-8 items-center justify-center rounded text-xs transition-colors hover:bg-blue-50"
                style={{
                  color: inMonth ? "#374151" : "#D1D5DB",
                  backgroundColor: isSelected ? "var(--strabb-secondary)" : undefined,
                  ...(isSelected ? { color: "white" } : {}),
                }}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom range */}
      <div className="border-t px-3 py-2" style={{ borderColor: "var(--border)" }}>
        <p className="mb-1 text-xs font-medium text-gray-500">Custom Range</p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            className="flex-1 rounded border px-2 py-1 text-xs"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="flex-1 rounded border px-2 py-1 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={handleApplyCustom}
          className="mt-2 w-full rounded-lg py-1.5 text-xs text-white"
          style={{ backgroundColor: "var(--strabb-secondary)" }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
