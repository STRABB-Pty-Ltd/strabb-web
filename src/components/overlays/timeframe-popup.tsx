"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const WEEK_OPTS = { weekStartsOn: 1 as const };
const AUTO_CONFIRM_SECONDS = 7;

type TimeframePage = "dashboard" | "calendar" | "cleaning" | "reporting";

const isTimeframePage = (p: PageId): p is TimeframePage =>
  p === "dashboard" || p === "calendar" || p === "cleaning" || p === "reporting";

export function TimeframePopup() {
  const tfPopup = useAppStore((s) => s.tfPopup);
  const closeTimeframePopup = useAppStore((s) => s.closeTimeframePopup);
  const setTimeframeAnchor = useAppStore((s) => s.setTimeframeAnchor);
  const setCustomRange = useAppStore((s) => s.setCustomRange);
  const customRange = useAppStore((s) => s.customRange);
  const currentPage = useAppStore((s) => s.currentPage);
  const dashboard = useAppStore((s) => s.dashboard);
  const calendar = useAppStore((s) => s.calendar);
  const cleaning = useAppStore((s) => s.cleaning);
  const reporting = useAppStore((s) => s.reporting);

  // Auto-confirm: when popup opens because of a window-size change, auto-close
  // after AUTO_CONFIRM_SECONDS. Mouse-down inside the popup body cancels via
  // cancelAutoConfirm. Picking a period or closing the popup ends it naturally.
  const [progressActive, setProgressActive] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (!tfPopup.open || !tfPopup.autoSelect) {
      setProgressActive(false);
      return;
    }
    setProgressActive(true);
    const timer = setTimeout(() => {
      if (!cancelledRef.current) closeTimeframePopup();
    }, AUTO_CONFIRM_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [tfPopup.open, tfPopup.autoSelect, closeTimeframePopup]);

  const cancelAutoConfirm = useCallback(() => {
    cancelledRef.current = true;
    setProgressActive(false);
  }, []);

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

  if (!tfPopup.open || !isTimeframePage(currentPage)) return null;

  const slice =
    currentPage === "dashboard"
      ? dashboard
      : currentPage === "calendar"
        ? calendar
        : currentPage === "cleaning"
          ? cleaning
          : reporting;
  const { windowSize, anchor } = slice as { windowSize: string; anchor: string | null };

  const writeAnchor = (next: string) => {
    setTimeframeAnchor(currentPage, next);
    closeTimeframePopup();
  };

  return (
    <>
      <div className="fixed inset-0 z-[140]" onClick={closeTimeframePopup} />
      <div
        className="fixed z-[150] rounded-xl border bg-white shadow-xl"
        style={{
          top: 144,
          left: `calc(var(--sidebar-width) + 8px)`,
          width: 377,
          borderColor: "var(--border)",
        }}
        onMouseDown={cancelAutoConfirm}
      >
        <div
          className="px-sm py-base flex items-center justify-between border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-body font-semibold capitalize">{labelForWindow(windowSize)}</span>
          <button
            type="button"
            onClick={closeTimeframePopup}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {progressActive && (
          <div
            aria-label="Auto-confirming current period"
            className="overflow-hidden"
            style={{ height: 3, backgroundColor: "var(--neutral-30)" }}
          >
            <div className="drain-progress h-full" />
          </div>
        )}

        <div className="p-sm">
          {windowSize === "month" && <MonthPicker anchor={anchor} onPick={writeAnchor} />}
          {windowSize === "quarter" && <QuarterPicker anchor={anchor} onPick={writeAnchor} />}
          {windowSize === "year" && <YearPicker anchor={anchor} onPick={writeAnchor} />}
          {(windowSize === "day" || windowSize === "week" || windowSize === "fortnight") && (
            <DayPicker windowSize={windowSize} anchor={anchor} onPick={writeAnchor} />
          )}
          {windowSize === "ytd" && (
            <p className="text-body text-gray-600">
              Year-to-date is always relative to today. Switch to <strong>Year</strong> to pick a
              specific year.
            </p>
          )}
          {windowSize === "custom" && (
            <CustomRangeForm
              initial={customRange}
              onApply={(start, end) => {
                setCustomRange({ start, end });
                closeTimeframePopup();
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

function labelForWindow(ws: string): string {
  switch (ws) {
    case "day":
      return "Pick a day";
    case "week":
      return "Pick a week";
    case "fortnight":
      return "Pick a fortnight";
    case "month":
      return "Pick a month";
    case "quarter":
      return "Pick a quarter";
    case "year":
      return "Pick a year";
    case "ytd":
      return "Year to date";
    case "custom":
      return "Custom range";
    default:
      return ws;
  }
}

function resolveDate(anchor: string | null): Date {
  return anchor ? parseISO(anchor) : new Date();
}

function MonthPicker({ anchor, onPick }: { anchor: string | null; onPick: (iso: string) => void }) {
  const effective = resolveDate(anchor);
  const [year, setYear] = useState(effective.getFullYear());
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  const selectedMonth = effective.getMonth();
  const selectedYear = effective.getFullYear();

  return (
    <div>
      <div className="mb-sm flex items-center justify-between">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-gray-100"
          aria-label="Previous year"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-body font-semibold">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-gray-100"
          aria-label="Next year"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="gap-xs grid grid-cols-3">
        {months.map((m) => {
          const isSelected = selectedMonth === m.getMonth() && selectedYear === year;
          return (
            <button
              key={m.toISOString()}
              type="button"
              onClick={() => onPick(format(startOfMonth(m), "yyyy-MM-dd"))}
              className="px-sm py-base text-body rounded-lg transition-colors"
              style={{
                backgroundColor: isSelected ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
                color: isSelected ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
              }}
            >
              {format(m, "MMM")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuarterPicker({
  anchor,
  onPick,
}: {
  anchor: string | null;
  onPick: (iso: string) => void;
}) {
  const effective = resolveDate(anchor);
  const [year, setYear] = useState(effective.getFullYear());
  const selectedQ = Math.floor(effective.getMonth() / 3);
  const selectedYear = effective.getFullYear();

  return (
    <div>
      <div className="mb-sm flex items-center justify-between">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-gray-100"
          aria-label="Previous year"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-body font-semibold">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-gray-100"
          aria-label="Next year"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="gap-xs grid grid-cols-2">
        {[0, 1, 2, 3].map((q) => {
          const isSelected = selectedQ === q && selectedYear === year;
          return (
            <button
              key={q}
              type="button"
              onClick={() => onPick(format(startOfQuarter(new Date(year, q * 3, 1)), "yyyy-MM-dd"))}
              className="px-sm py-base text-body rounded-lg"
              style={{
                backgroundColor: isSelected ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
                color: isSelected ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
              }}
            >
              Q{q + 1} {year}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YearPicker({ anchor, onPick }: { anchor: string | null; onPick: (iso: string) => void }) {
  const current = new Date().getFullYear();
  const selected = anchor ? parseISO(anchor).getFullYear() : current;
  const years = Array.from({ length: 11 }, (_, i) => current - 5 + i);
  return (
    <div className="gap-xs grid grid-cols-3">
      {years.map((y) => {
        const isSelected = y === selected;
        return (
          <button
            key={y}
            type="button"
            onClick={() => onPick(format(startOfYear(new Date(y, 0, 1)), "yyyy-MM-dd"))}
            className="px-sm py-base text-body rounded-lg"
            style={{
              backgroundColor: isSelected ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
              color: isSelected ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
            }}
          >
            {y}
          </button>
        );
      })}
    </div>
  );
}

function DayPicker({
  windowSize,
  anchor,
  onPick,
}: {
  windowSize: string;
  anchor: string | null;
  onPick: (iso: string) => void;
}) {
  const effective = resolveDate(anchor);
  const [viewDate, setViewDate] = useState(startOfMonth(effective));
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, WEEK_OPTS);
  const gridEnd = endOfWeek(monthEnd, WEEK_OPTS);
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Highlight the period containing `effective`. For week/fortnight, that's the
  // start-of-week date for the period.
  const selectedDate = windowSize === "day" ? effective : startOfWeek(effective, WEEK_OPTS);

  const handlePick = (day: Date) => {
    let snap: Date;
    if (windowSize === "day") snap = day;
    else snap = startOfWeek(day, WEEK_OPTS); // week + fortnight snap to Monday
    onPick(format(snap, "yyyy-MM-dd"));
  };

  return (
    <div>
      <div className="mb-sm flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-gray-100"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-body font-semibold">{format(viewDate, "MMMM yyyy")}</span>
        <button
          type="button"
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-gray-100"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>
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
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handlePick(day)}
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
  );
}

function CustomRangeForm({
  initial,
  onApply,
}: {
  initial: { start: string; end: string } | null;
  onApply: (start: string, end: string) => void;
}) {
  const [start, setStart] = useState(initial?.start ?? "");
  const [end, setEnd] = useState(initial?.end ?? "");

  // ISO yyyy-MM-dd strings sort lexicographically, so string compare works.
  const bothFilled = start !== "" && end !== "";
  const orderInvalid = bothFilled && start > end;
  const valid = bothFilled && !orderInvalid;

  return (
    <div>
      <div className="gap-base flex items-center">
        <label className="flex-1">
          <span className="sr-only">Start date</span>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="px-base py-xs text-body w-full rounded border"
            style={{ borderColor: "var(--border)" }}
          />
        </label>
        <span className="text-body text-gray-400">to</span>
        <label className="flex-1">
          <span className="sr-only">End date</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="px-base py-xs text-body w-full rounded border"
            style={{ borderColor: "var(--border)" }}
          />
        </label>
      </div>
      {orderInvalid && (
        <p role="alert" className="mt-xs text-body" style={{ color: "var(--status-danger)" }}>
          End date must be on or after start date.
        </p>
      )}
      <button
        type="button"
        disabled={!valid}
        onClick={() => onApply(start, end)}
        className="mt-base py-xs text-body w-full rounded-lg text-white disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: "var(--strabb-secondary)" }}
      >
        Apply
      </button>
    </div>
  );
}
