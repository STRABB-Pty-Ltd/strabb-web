import { timeframeToDateRange } from "@/lib/timeframe-utils";

export type ShareableMenu = "dashboard" | "calendar" | "messaging" | "operations" | "reporting";

export interface ShareFilterContext {
  windowSize: string;
  anchor: string | null;
  customRange: { start: string; end: string } | null;
  selectedListings: string[];
}

export interface ShareFilters {
  startDate: string;
  endDate: string;
  listingIds: string[];
}

/**
 * Build the filter snapshot the backend expects for a given menu's PDF render.
 * Backend hydrators tolerate missing keys, so we keep this lean: timeframe +
 * listing scope. Per-menu extras (status, channel, etc.) can extend later.
 */
export function buildShareFilters(_menu: ShareableMenu, ctx: ShareFilterContext): ShareFilters {
  const { startDate, endDate } = timeframeToDateRange(ctx.windowSize, ctx.anchor, ctx.customRange);
  return {
    startDate,
    endDate,
    listingIds: ctx.selectedListings,
  };
}
