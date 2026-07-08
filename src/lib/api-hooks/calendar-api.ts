"use client";

import { useQuery } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import { blockReasonLabel } from "@/lib/schemas/availability-block";

export type CalendarEventType =
  | "booking"
  | "vacancy"
  | "ticket"
  | "cleaning"
  | "availability_block";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  listingId: string;
  listingName: string;
  label: string;
  start: string;
  end: string;
  color: string;
  channel?: string;
  guest?: string;
  status?: string;
  amount?: number;
  isImplicitBlock?: boolean;
}

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
  // Availability blocks carry their reason enum as the title; show the
  // human label ("Owner stay"), not the wire value ("owner_block").
  const label = raw.entityType === "availability_block" ? blockReasonLabel(raw.title) : raw.title;
  return {
    id: raw.id,
    type: raw.entityType as CalendarEvent["type"],
    listingId: raw.listingId,
    listingName: raw.listingName,
    label,
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
  const isReady = useAuthReady();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  const isOverview = submenuFilters.length === 0 || submenuFilters.includes("overview");
  if (isOverview) {
    // Show everything except vacancy unless explicitly selected
    ["booking", "cleaning", "ticket", "availability_block"].forEach((t) =>
      params.append("types", t),
    );
  } else {
    // Map submenu chip IDs (plural) to API entity types (singular)
    const chipToType: Record<string, string> = {
      bookings: "booking",
      cleaning: "cleaning",
      vacancy: "vacancy",
      ticket: "ticket",
    };
    submenuFilters.forEach((t) => {
      const mapped = chipToType[t] ?? t;
      params.append("types", mapped);
    });
    // Tickets chip surfaces bookings alongside so the operator sees the
    // ticket in the context of the booking it relates to.
    if (submenuFilters.includes("ticket")) {
      params.append("types", "booking");
    }
    // Blocked dates belong wherever bookings show: both mean "this night
    // is not sellable" to a host scanning the calendar.
    if (submenuFilters.includes("bookings")) {
      params.append("types", "availability_block");
    }
  }
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  return useQuery<CalendarEvent[]>({
    queryKey: [
      "calendar-events",
      ...selectedListings,
      ...submenuFilters,
      startDate ?? "",
      endDate ?? "",
    ],
    queryFn: async () => {
      const response = await apiClient.get<{ data: RawCalendarEvent[] }>(
        `/calendar/events?${params.toString()}`,
      );
      return response.data.map(mapCalendarEvent);
    },
    enabled: isReady,
  });
}
