"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
export const WEEK_OPTS = { weekStartsOn: 1 as const };

interface MonthGridProps {
  viewDate: Date;
  onViewDateChange: (next: Date) => void;
  isHighlighted: (day: Date) => boolean;
  isStrongHighlighted?: (day: Date) => boolean;
  onDayClick: (day: Date) => void;
  onDayHover?: (day: Date | null) => void;
}

/**
 * Shared month grid: header + day labels + 6x7 cell grid. Highlight modes are
 * delegated to the parent via predicates so day, week, fortnight, range and
 * single-date pickers all render identically.
 */
export function MonthGrid({
  viewDate,
  onViewDateChange,
  isHighlighted,
  isStrongHighlighted,
  onDayClick,
  onDayHover,
}: MonthGridProps) {
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, WEEK_OPTS);
  const gridEnd = endOfWeek(monthEnd, WEEK_OPTS);
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div>
      <div className="mb-sm flex items-center justify-between">
        <button
          type="button"
          onClick={() => onViewDateChange(subMonths(viewDate, 1))}
          className="hover:bg-neutral-30 inline-flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span className="text-body font-semibold">{format(viewDate, "MMMM yyyy")}</span>
        <button
          type="button"
          onClick={() => onViewDateChange(addMonths(viewDate, 1))}
          className="hover:bg-neutral-30 inline-flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
          aria-label="Next month"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="mb-xs gap-xs grid grid-cols-7">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-body text-highlight-10 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="gap-xs grid grid-cols-7" onMouseLeave={() => onDayHover?.(null)}>
        {gridDays.map((day) => {
          const inMonth = isSameMonth(day, viewDate);
          const strong = isStrongHighlighted?.(day) ?? false;
          const soft = !strong && isHighlighted(day);

          let bg: string | undefined;
          let fg: string;
          if (strong) {
            bg = "var(--highlight-10)";
            fg = "var(--surface-60)";
          } else if (soft) {
            bg = "var(--neutral-30)";
            fg = "var(--highlight-10)";
          } else {
            bg = undefined;
            fg = inMonth ? "var(--highlight-10)" : "var(--neutral-30)";
          }

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick(day)}
              onMouseEnter={() => onDayHover?.(day)}
              className="h-lg text-body hover:bg-neutral-30 flex items-center justify-center rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{ color: fg, backgroundColor: bg }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
