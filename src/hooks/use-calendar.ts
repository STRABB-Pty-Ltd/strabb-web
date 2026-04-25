"use client";

import { useMemo } from "react";

import { USE_MOCK } from "@/lib/mock-data";
import { useCalendarEventsMock } from "@/lib/mock-data/calendar-hooks";
import { useCalendarEventsAPI } from "@/lib/api-hooks/calendar-api";
import { timeframeToDateRange } from "@/lib/timeframe-utils";

import type { CalendarEvent } from "@/lib/mock-data/calendar-hooks";

export type { CalendarEvent, CalendarEventType } from "@/lib/mock-data/calendar-hooks";

export function useCalendarEvents(
  selectedListings: string[],
  submenuFilters: string[],
  windowSize: string = "month",
  anchor: string | null = null,
) {
  const { startDate, endDate } = timeframeToDateRange(windowSize, anchor);
  const mockResult = useCalendarEventsMock(selectedListings, submenuFilters);
  const apiResult = useCalendarEventsAPI(selectedListings, submenuFilters, startDate, endDate);

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }

  return {
    data: apiResult.data,
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useCalendarListSort(
  events: CalendarEvent[],
  sortKey: string,
  sortDirection: "asc" | "desc",
) {
  return useMemo(() => {
    const sorted = [...events].sort((a, b) => {
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
