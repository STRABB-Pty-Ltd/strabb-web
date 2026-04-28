import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export type WindowSize =
  | "day"
  | "week"
  | "fortnight"
  | "month"
  | "quarter"
  | "year"
  | "ytd"
  | "custom";

const WEEK_OPTS = { weekStartsOn: 1 as const };

function resolveAnchor(anchor: string | null | undefined): Date {
  if (!anchor) return new Date();
  return parseISO(anchor);
}

function snapToWindowStart(date: Date, windowSize: WindowSize): Date {
  switch (windowSize) {
    case "day":
      return startOfDay(date);
    case "week":
    case "fortnight":
      return startOfWeek(date, WEEK_OPTS);
    case "month":
      return startOfMonth(date);
    case "quarter":
      return startOfQuarter(date);
    case "year":
    case "ytd":
      return startOfYear(date);
    case "custom":
      return startOfDay(date);
  }
}

/**
 * Compute the date range covered by a (windowSize, anchor) pair.
 * `anchor` null/undefined → period relative to now.
 * `customRange` only applies when windowSize === "custom".
 */
export function timeframeToDateRange(
  windowSize: string,
  anchor?: string | null,
  customRange?: { start: string; end: string } | null,
): DateRange {
  const ws = windowSize as WindowSize;

  if (ws === "custom") {
    if (customRange?.start && customRange?.end) {
      return { startDate: customRange.start, endDate: customRange.end };
    }
    const now = new Date();
    return { startDate: fmt(startOfDay(now)), endDate: fmt(endOfDay(now)) };
  }

  if (ws === "ytd") {
    const now = new Date();
    return { startDate: fmt(startOfYear(now)), endDate: fmt(endOfDay(now)) };
  }

  const start = snapToWindowStart(resolveAnchor(anchor), ws);
  let end: Date;
  switch (ws) {
    case "day":
      end = endOfDay(start);
      break;
    case "week":
      end = endOfWeek(start, WEEK_OPTS);
      break;
    case "fortnight":
      end = endOfDay(addDays(start, 13));
      break;
    case "month":
      end = endOfMonth(start);
      break;
    case "quarter":
      end = endOfQuarter(start);
      break;
    case "year":
      end = endOfYear(start);
      break;
    default:
      end = endOfMonth(start);
  }

  return { startDate: fmt(start), endDate: fmt(end) };
}

/**
 * Step the anchor by ±1 windowSize unit. Returns ISO date string at the start
 * of the new period, or null when stepping doesn't apply (ytd/custom).
 */
export function stepAnchor(
  windowSize: string,
  anchor: string | null | undefined,
  direction: 1 | -1,
): string | null {
  const ws = windowSize as WindowSize;
  if (ws === "ytd" || ws === "custom") return null;

  const current = snapToWindowStart(resolveAnchor(anchor), ws);
  let next: Date;
  switch (ws) {
    case "day":
      next = addDays(current, direction);
      break;
    case "week":
      next = addWeeks(current, direction);
      break;
    case "fortnight":
      next = addWeeks(current, 2 * direction);
      break;
    case "month":
      next = addMonths(current, direction);
      break;
    case "quarter":
      next = addMonths(current, 3 * direction);
      break;
    case "year":
      next = addYears(current, direction);
      break;
    default:
      next = current;
  }
  return fmt(next);
}

/** Human-readable label for the stepper. */
export function formatPeriodLabel(
  windowSize: string,
  anchor: string | null | undefined,
  customRange?: { start: string; end: string } | null,
): string {
  const ws = windowSize as WindowSize;

  if (ws === "ytd") return "Year to date";
  if (ws === "custom") {
    if (customRange?.start && customRange?.end) {
      const s = parseISO(customRange.start);
      const e = parseISO(customRange.end);
      return `${format(s, "d MMM yyyy")} – ${format(e, "d MMM yyyy")}`;
    }
    return "Custom range";
  }

  const start = snapToWindowStart(resolveAnchor(anchor), ws);
  switch (ws) {
    case "day":
      return format(start, "EEEE, d MMMM yyyy");
    case "week": {
      const end = endOfWeek(start, WEEK_OPTS);
      return formatRange(start, end);
    }
    case "fortnight": {
      const end = addDays(start, 13);
      return formatRange(start, end);
    }
    case "month":
      return format(start, "MMMM yyyy");
    case "quarter":
      return `Q${Math.floor(start.getMonth() / 3) + 1} ${format(start, "yyyy")}`;
    case "year":
      return format(start, "yyyy");
  }
  return format(start, "MMMM yyyy");
}

/**
 * Date range for a Gantt view. When `anchor` is null the leftmost date is
 * today − 2 days (so today + the next stretch sit in view), with the duration
 * derived from `windowSize`. When `anchor` is set this falls back to the
 * standard period-aligned range.
 */
export function ganttDateRange(
  windowSize: string,
  anchor?: string | null,
  customRange?: { start: string; end: string } | null,
): DateRange {
  if (anchor) return timeframeToDateRange(windowSize, anchor, customRange);
  if (windowSize === "custom" && customRange?.start && customRange?.end) {
    return { startDate: customRange.start, endDate: customRange.end };
  }

  const start = addDays(startOfDay(new Date()), -2);
  let end: Date;
  switch (windowSize as WindowSize) {
    case "day":
      end = start;
      break;
    case "week":
      end = addDays(start, 6);
      break;
    case "fortnight":
      end = addDays(start, 13);
      break;
    case "month":
      end = addDays(start, 29);
      break;
    case "quarter":
      end = addDays(start, 89);
      break;
    case "year":
      end = addDays(start, 364);
      break;
    case "ytd":
      // YTD has no clean gantt interpretation — fall back to fortnight.
      end = addDays(start, 13);
      break;
    default:
      end = addDays(start, 13);
  }
  return { startDate: fmt(start), endDate: fmt(end) };
}

function formatRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${format(start, "d")}–${format(end, "d MMMM yyyy")}`;
  }
  if (sameYear) {
    return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
  }
  return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
}

function fmt(d: Date): string {
  return format(d, "yyyy-MM-dd");
}
