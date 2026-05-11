"use client";

import {
  addDays,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";
import { MonthGrid, WEEK_OPTS } from "@/components/ui/month-grid";
import { canvasOverlayStyle } from "@/lib/canvas-overlay-style";
import { Z } from "@/lib/z-index";
import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

const AUTO_CONFIRM_SECONDS = 3;
const EXIT_MS = 200;

type TimeframePage = "dashboard" | "calendar" | "cleaning" | "reporting";

const isTimeframePage = (p: PageId): p is TimeframePage =>
  p === "dashboard" || p === "calendar" || p === "cleaning" || p === "reporting";

export function TimeframePopup() {
  const popupRef = useRef<HTMLDivElement>(null);
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

  // Resolve the active slice up-front so the auto-confirm timer can read
  // windowSize before the early return below.
  const slice = isTimeframePage(currentPage)
    ? currentPage === "dashboard"
      ? dashboard
      : currentPage === "calendar"
        ? calendar
        : currentPage === "cleaning"
          ? cleaning
          : reporting
    : null;
  const windowSize = (slice as { windowSize?: string } | null)?.windowSize ?? "";
  const anchor = (slice as { anchor?: string | null } | null)?.anchor ?? null;

  // Auto-confirm: when popup opens because of a window-size change, auto-close
  // after AUTO_CONFIRM_SECONDS. Mouse-down inside the popup body cancels via
  // cancelAutoConfirm. Custom range is excluded - users are filling a form,
  // a timer would interrupt them.
  const [progressActive, setProgressActive] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    // Skip auto-confirm entirely when the user prefers reduced motion - the
    // draining bar wouldn't animate and a silent timer firing on its own
    // contradicts the spirit of the preference. Reduced-motion users dismiss
    // manually via Esc, click-outside, or selecting an option.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!tfPopup.open || !tfPopup.autoSelect || windowSize === "custom" || prefersReduced) {
      setProgressActive(false);
      return;
    }
    setProgressActive(true);
    const timer = setTimeout(() => {
      if (!cancelledRef.current) closeTimeframePopup();
    }, AUTO_CONFIRM_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [tfPopup.open, tfPopup.autoSelect, windowSize, closeTimeframePopup]);

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

  useClickOutside(popupRef, closeTimeframePopup, tfPopup.open);

  // Anchor rect is captured at click time; if the user resizes the window the
  // saved coords go stale, so close rather than render in the wrong place.
  useEffect(() => {
    if (!tfPopup.open) return;
    const handler = () => closeTimeframePopup();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [tfPopup.open, closeTimeframePopup]);

  // Return focus to the trigger when the popup closes, so keyboard users
  // don't lose their place in the tab order.
  const previousFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (tfPopup.open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [tfPopup.open]);

  const open = tfPopup.open && isTimeframePage(currentPage);
  const { shouldRender } = useDelayedClose(open, EXIT_MS);
  if (!shouldRender) return null;

  const writeAnchor = (next: string) => {
    if (!isTimeframePage(currentPage)) return;
    setTimeframeAnchor(currentPage, next);
    closeTimeframePopup();
  };

  // Position relative to the trigger element when an anchor was captured;
  // fall back to the canvas content top-left when no anchor is provided.
  // POPUP_WIDTH mirrors --drilldown-width; CANVAS_PAD mirrors --space-md so the
  // popup keeps the same gap from the canvas top as it has from the screen
  // sides. CSS max() in `top` clamps so the popup never protrudes above the
  // canvas content area, even if the trigger sits right under the submenu.
  const POPUP_WIDTH = 377;
  const CANVAS_PAD = 21;
  const positionStyle: { top: number | string; left: number | string } = tfPopup.anchor
    ? (() => {
        const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
        const sidebarWidth = viewportWidth * 0.16;
        const minLeft = sidebarWidth + CANVAS_PAD;
        const maxLeft = viewportWidth - POPUP_WIDTH - CANVAS_PAD;
        return {
          top: `max(calc(var(--canvas-top) + var(--space-md) - 2px), ${tfPopup.anchor.bottom + CANVAS_PAD}px)`,
          left: Math.max(minLeft, Math.min(tfPopup.anchor.left, maxLeft)),
        };
      })()
    : {
        top: "calc(var(--canvas-top) + var(--space-md) - 2px)",
        left: "calc(var(--sidebar-width) + var(--space-md))",
      };

  const cardAnim = !open
    ? `scaleOut ${EXIT_MS}ms ease-in forwards`
    : `scaleIn ${EXIT_MS}ms ease-out`;

  return (
    <>
      <div
        style={{ ...canvasOverlayStyle, zIndex: Z.DRAWER_SCRIM }}
        onClick={closeTimeframePopup}
      />
      <div
        ref={popupRef}
        className="bg-surface-60 fixed rounded-xl border shadow-xl"
        style={{
          zIndex: Z.DRAWER,
          top: positionStyle.top,
          left: positionStyle.left,
          width: POPUP_WIDTH,
          borderColor: "var(--border)",
          animation: cardAnim,
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
            className="text-highlight-10 hover:bg-neutral-30 inline-flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            aria-label="Close"
            data-no-elevate
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
            <div
              className="drain-progress h-full"
              style={{ "--drain-duration": `${AUTO_CONFIRM_SECONDS}s` } as CSSProperties}
            />
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
            <p className="text-body text-highlight-10">
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
          className="hover:bg-neutral-30 inline-flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center rounded"
          aria-label="Previous year"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-body font-semibold">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="hover:bg-neutral-30 inline-flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center rounded"
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
          className="hover:bg-neutral-30 inline-flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center rounded"
          aria-label="Previous year"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-body font-semibold">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="hover:bg-neutral-30 inline-flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center rounded"
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
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const periodLength = windowSize === "fortnight" ? 14 : windowSize === "week" ? 7 : 1;
  const periodStartFor = (day: Date): Date =>
    windowSize === "day" ? day : startOfWeek(day, WEEK_OPTS);
  const isInPeriod = (day: Date, start: Date): boolean => {
    const end = addDays(start, periodLength - 1);
    return day.getTime() >= start.getTime() && day.getTime() <= end.getTime();
  };

  const selectedStart = periodStartFor(effective);
  const hoverStart = hoverDate ? periodStartFor(hoverDate) : null;

  const handlePick = (day: Date) => {
    onPick(format(periodStartFor(day), "yyyy-MM-dd"));
  };

  return (
    <MonthGrid
      viewDate={viewDate}
      onViewDateChange={setViewDate}
      // Day mode: single navy cell, no band. Week/fortnight: grey band - hover
      // overrides the auto-selected period when the user mouses elsewhere.
      isStrongHighlighted={windowSize === "day" ? (day) => isSameDay(day, effective) : undefined}
      isHighlighted={(day) => {
        if (windowSize === "day") return false;
        if (hoverStart) return isInPeriod(day, hoverStart);
        return isInPeriod(day, selectedStart);
      }}
      onDayClick={handlePick}
      onDayHover={setHoverDate}
    />
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
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState<Date>(
    initial?.start ? parseISO(initial.start) : new Date(),
  );

  const startDate = start ? parseISO(start) : null;
  const endDate = end ? parseISO(end) : null;

  // ISO yyyy-MM-dd strings sort lexicographically, so string compare works.
  const bothFilled = start !== "" && end !== "";
  const orderInvalid = bothFilled && start > end;
  const valid = bothFilled && !orderInvalid;

  // Click sequence: 1st click sets start (clears end), 2nd click sets end. If
  // the second click is earlier than the first, swap so the range stays sorted.
  const handleDayClick = (day: Date) => {
    const dayIso = format(day, "yyyy-MM-dd");
    if (!start || bothFilled) {
      setStart(dayIso);
      setEnd("");
      return;
    }
    if (dayIso < start) {
      setEnd(start);
      setStart(dayIso);
    } else {
      setEnd(dayIso);
    }
  };

  // Highlight the band between start and end (or hover preview while end is
  // still empty). Endpoints get the strong navy treatment.
  const previewEnd = endDate ?? hoverDate;
  const isInRange = (day: Date): boolean => {
    if (!startDate || !previewEnd) return false;
    const lo = startDate.getTime() <= previewEnd.getTime() ? startDate : previewEnd;
    const hi = startDate.getTime() <= previewEnd.getTime() ? previewEnd : startDate;
    return day.getTime() >= lo.getTime() && day.getTime() <= hi.getTime();
  };
  const isEndpoint = (day: Date): boolean => {
    if (startDate && isSameDay(day, startDate)) return true;
    if (endDate && isSameDay(day, endDate)) return true;
    return false;
  };

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
            style={{ backgroundColor: "var(--surface-60)", borderColor: "var(--border)" }}
          />
        </label>
        <span className="text-body text-highlight-10">to</span>
        <label className="flex-1">
          <span className="sr-only">End date</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="px-base py-xs text-body w-full rounded border"
            style={{ backgroundColor: "var(--surface-60)", borderColor: "var(--border)" }}
          />
        </label>
      </div>

      <div className="mt-sm">
        <MonthGrid
          viewDate={viewDate}
          onViewDateChange={setViewDate}
          isHighlighted={isInRange}
          isStrongHighlighted={isEndpoint}
          onDayClick={handleDayClick}
          onDayHover={setHoverDate}
        />
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
        className="mt-base py-xs text-body text-surface-60 w-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: "var(--strabb-secondary)", color: "var(--surface-60)" }}
      >
        Apply
      </button>
    </div>
  );
}
