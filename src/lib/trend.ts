// Single source for the revenue trend-direction threshold used in chart
// summaries (dashboard sparkline + reporting revenue trend). Moves within
// +/-5% of the first value read as flat.
export const TREND_FLAT_THRESHOLD = 0.05;

export type TrendDirection = "trending up" | "trending down" | "broadly flat";

export function trendDirection(first: number, latest: number): TrendDirection {
  if (latest > first * (1 + TREND_FLAT_THRESHOLD)) return "trending up";
  if (latest < first * (1 - TREND_FLAT_THRESHOLD)) return "trending down";
  return "broadly flat";
}
