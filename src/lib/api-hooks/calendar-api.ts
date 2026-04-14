"use client";

import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import type { CalendarEvent } from "@/lib/mock-data/calendar-hooks";

// Backend calendar event shape after global keysToCamel
interface RawCalendarEvent {
  id: string;
  entityType: string;
  listingId: string;
  listingName: string;
  start: string;
  end: string;
  title: string;
  status: string;
  color: string;
  metadata: {
    channel?: string;
    guest?: string;
    amount?: number;
    assignee?: string;
    priority?: string;
  } | null;
  blockedChildren: string[] | null;
}

function mapCalendarEvent(raw: RawCalendarEvent): CalendarEvent {
  return {
    id: raw.id,
    type: raw.entityType as CalendarEvent["type"],
    listingId: raw.listingId,
    listingName: raw.listingName,
    label: raw.title,
    start: raw.start,
    end: raw.end,
    color: raw.color,
    channel: raw.metadata?.channel,
    guest: raw.metadata?.guest,
    status: raw.status,
    amount: raw.metadata?.amount,
  };
}

export function useCalendarEventsAPI(
  selectedListings: string[],
  submenuFilters: string[],
  startDate?: string,
  endDate?: string,
) {
  const apiClient = useApiClient();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  submenuFilters.forEach((t) => params.append("types", t));
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  return useQuery<CalendarEvent[]>({
    queryKey: ["calendar-events", ...selectedListings, ...submenuFilters],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawCalendarEvent[] }>(`/calendar/events?${params.toString()}`);
      return response.data.map(mapCalendarEvent);
    },
    enabled: !USE_MOCK,
  });
}
