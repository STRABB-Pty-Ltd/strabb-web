"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPeriodLabel, stepAnchor } from "@/lib/timeframe-utils";
import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

type TimeframePage = "dashboard" | "calendar" | "operations" | "reporting";

const isTimeframePage = (p: PageId): p is TimeframePage =>
  p === "dashboard" || p === "calendar" || p === "operations" || p === "reporting";

export function TimeframeStepper() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setTimeframeAnchor = useAppStore((s) => s.setTimeframeAnchor);
  const openTimeframePopup = useAppStore((s) => s.openTimeframePopup);

  const dashboard = useAppStore((s) => s.dashboard);
  const calendar = useAppStore((s) => s.calendar);
  const operations = useAppStore((s) => s.operations);
  const reporting = useAppStore((s) => s.reporting);
  const customRange = useAppStore((s) => s.customRange);

  if (!isTimeframePage(currentPage)) return null;

  const slice =
    currentPage === "dashboard"
      ? dashboard
      : currentPage === "calendar"
        ? calendar
        : currentPage === "operations"
          ? operations
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleStep(-1)}
          aria-label="Previous period"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
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
        className="font-semibold"
      >
        {label}
      </Button>
      {canStep && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleStep(1)}
          aria-label="Next period"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
