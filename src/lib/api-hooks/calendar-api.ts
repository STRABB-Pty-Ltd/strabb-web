"use client";

import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import type { CalendarEvent } from "@/lib/mock-data/calendar-hooks";

export function useCalendarEventsAPI(
  selectedListings: string[],
  submenuFilters: string[],
  startDate?: string,
  endDate?: string,
) {
  const apiClient = useApiClient();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids[]", id));
  submenuFilters.forEach((t) => params.append("types[]", t));
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  return useQuery<CalendarEvent[]>({
    queryKey: ["calendar-events", ...selectedListings, ...submenuFilters],
    queryFn: () => apiClient.get(`/calendar/events?${params.toString()}`),
    enabled: !USE_MOCK,
  });
}
