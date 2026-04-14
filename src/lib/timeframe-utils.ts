import {
  addDays,
  addWeeks,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  subWeeks,
  format,
} from "date-fns";

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Convert a store timeframe name (e.g. "this_month") to ISO date strings
 * suitable for API query parameters (YYYY-MM-DD).
 */
export function timeframeToDateRange(timeframe: string): DateRange {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (timeframe) {
    case "today":
    case "day":
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case "this_week":
    case "week":
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "fortnight":
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = addWeeks(start, 2);
      break;
    case "last_week": {
      const lastWeek = subWeeks(now, 1);
      start = startOfWeek(lastWeek, { weekStartsOn: 1 });
      end = endOfWeek(lastWeek, { weekStartsOn: 1 });
      break;
    }
    case "this_month":
    case "month":
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case "last_month": {
      const lastMonth = subMonths(now, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
      break;
    }
    case "this_quarter":
    case "quarter":
      start = startOfQuarter(now);
      end = endOfQuarter(now);
      break;
    case "this_year":
      start = startOfYear(now);
      end = endOfYear(now);
      break;
    case "ytd":
      start = startOfYear(now);
      end = endOfDay(now);
      break;
    default:
      // Fallback: treat as this_month
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
  }

  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}
