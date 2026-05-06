"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { formatPeriodLabel, stepAnchor } from "@/lib/timeframe-utils";
import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

type TimeframePage = "dashboard" | "calendar" | "cleaning" | "reporting";

const isTimeframePage = (p: PageId): p is TimeframePage =>
  p === "dashboard" || p === "calendar" || p === "cleaning" || p === "reporting";

export function TimeframeStepper() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setTimeframeAnchor = useAppStore((s) => s.setTimeframeAnchor);
  const openTimeframePopup = useAppStore((s) => s.openTimeframePopup);

  const dashboard = useAppStore((s) => s.dashboard);
  const calendar = useAppStore((s) => s.calendar);
  const cleaning = useAppStore((s) => s.cleaning);
  const reporting = useAppStore((s) => s.reporting);
  const customRange = useAppStore((s) => s.customRange);

  if (!isTimeframePage(currentPage)) return null;

  const slice =
    currentPage === "dashboard"
      ? dashboard
      : currentPage === "calendar"
        ? calendar
        : currentPage === "cleaning"
          ? cleaning
          : reporting;

  const { windowSize, anchor } = slice as { windowSize: string; anchor: string | null };

  const label = formatPeriodLabel(windowSize, anchor, customRange);
  const canStep = windowSize !== "ytd" && windowSize !== "custom";

  const handleStep = (direction: 1 | -1) => {
    const next = stepAnchor(windowSize, anchor, direction);
    if (next !== null) setTimeframeAnchor(currentPage, next);
  };

  return (
    <div className="gap-base flex items-center" data-slot="timeframe-stepper">
      {canStep && (
        <button
          type="button"
          onClick={() => handleStep(-1)}
          className="min-h-lg inline-flex min-w-lg items-center justify-center rounded-sm hover:bg-neutral-30"
          aria-label="Previous period"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      <button
        type="button"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          openTimeframePopup({
            anchor: {
              top: rect.top,
              left: rect.left,
              bottom: rect.bottom,
              right: rect.right,
            },
          });
        }}
        className="text-body px-base min-h-lg inline-flex items-center rounded-sm font-semibold hover:bg-neutral-30"
      >
        {label}
      </button>
      {canStep && (
        <button
          type="button"
          onClick={() => handleStep(1)}
          className="min-h-lg inline-flex min-w-lg items-center justify-center rounded-sm hover:bg-neutral-30"
          aria-label="Next period"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
