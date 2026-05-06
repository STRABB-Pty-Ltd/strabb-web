"use client";

import { useMemo } from "react";

import { useCalendarEventsAPI } from "@/lib/api-hooks/calendar-api";
import { timeframeToDateRange } from "@/lib/timeframe-utils";

export type { CalendarEvent, CalendarEventType } from "@/lib/api-hooks/calendar-api";

export function useCalendarEvents(
  selectedListings: string[],
  submenuFilters: string[],
  windowSize: string = "month",
  anchor: string | null = null,
) {
  const { startDate, endDate } = timeframeToDateRange(windowSize, anchor);
  const apiResult = useCalendarEventsAPI(selectedListings, submenuFilters, startDate, endDate);

  return {
    data: apiResult.data,
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useCalendarListSort(
  events: ReturnType<typeof useCalendarEvents>["data"],
  sortKey: string,
  sortDirection: "asc" | "desc",
) {
  return useMemo(() => {
    const sorted = [...(events ?? [])].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "listing":
          cmp = a.listingName.localeCompare(b.listingName);
          break;
        case "guest":
          cmp = (a.guest ?? "").localeCompare(b.guest ?? "");
          break;
        case "channel":
          cmp = (a.channel ?? "").localeCompare(b.channel ?? "");
          break;
        case "checkin":
        case "date":
          cmp = new Date(a.start).getTime() - new Date(b.start).getTime();
          break;
        case "checkout":
          cmp = new Date(a.end).getTime() - new Date(b.end).getTime();
          break;
        case "status":
          cmp = (a.status ?? "").localeCompare(b.status ?? "");
          break;
        case "amount":
          cmp = (a.amount ?? 0) - (b.amount ?? 0);
          break;
        default:
          cmp = new Date(a.start).getTime() - new Date(b.start).getTime();
      }
      return sortDirection === "desc" ? -cmp : cmp;
    });
    return sorted;
  }, [events, sortKey, sortDirection]);
}
