"use client";

import { useMemo } from "react";

import { mockBookingList, mockListingList, mockMaintenanceList, mockVacancyList } from "./index";
import type { Booking } from "@/types/booking";
import type { Maintenance } from "@/types/maintenance";
import type { Vacancy } from "@/types/vacancy";

const listingNamesById: Record<string, string> = Object.fromEntries(
  mockListingList.map((l) => [l.id, l.name]),
);

export type CalendarEventType = "booking" | "vacancy" | "maintenance";

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
}

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

function bookingToEvent(b: Booking): CalendarEvent {
  return {
    id: b.id,
    type: "booking",
    listingId: b.listingId,
    listingName: b.listingName,
    label: `${b.guestName} — ${b.listingName}`,
    start: b.checkIn,
    end: b.checkOut,
    color: channelColors[b.channel] ?? "var(--channel-direct)",
    channel: b.channel,
    guest: b.guestName,
    status: b.status,
    amount: b.totalAmount,
  };
}

function vacancyToEvent(v: Vacancy): CalendarEvent {
  return {
    id: v.id,
    type: "vacancy",
    listingId: v.listingId,
    listingName: v.listingName,
    label: `Vacancy — ${v.listingName} (${v.gapDays}d)`,
    start: v.startDate,
    end: v.endDate,
    color: "var(--brand-10)",
  };
}

function maintenanceToEvent(m: Maintenance): CalendarEvent | null {
  if (!m.listingId) return null;
  const listingName = listingNamesById[m.listingId] ?? m.listingId;
  const start = m.dateScheduled ?? m.dateReported;
  const end = m.dateScheduled ?? m.dateReported;
  return {
    id: m.id,
    type: "maintenance",
    listingId: m.listingId,
    listingName,
    label: `${m.description} — ${listingName}`,
    start,
    end,
    color: "var(--status-danger)",
    status: m.status,
  };
}

function computeEvents(
  bookings: Booking[],
  vacancies: Vacancy[],
  maintenance: Maintenance[],
  selectedListings: string[],
  submenuFilters: string[],
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const showAll = submenuFilters.length === 0 || submenuFilters.includes("overview");
  const filterByListing = selectedListings.length > 0;

  if (showAll || submenuFilters.includes("bookings")) {
    const filtered = filterByListing
      ? bookings.filter((b) => selectedListings.includes(b.listingId))
      : bookings;
    events.push(...filtered.filter((b) => b.status !== "cancelled").map(bookingToEvent));
  }

  if (submenuFilters.includes("vacancy")) {
    const filtered = filterByListing
      ? vacancies.filter((v) => selectedListings.includes(v.listingId))
      : vacancies;
    events.push(...filtered.map(vacancyToEvent));
  }

  if (showAll || submenuFilters.includes("maintenance")) {
    const filtered = filterByListing
      ? maintenance.filter((m) => m.listingId && selectedListings.includes(m.listingId))
      : maintenance;
    const mapped = filtered
      .filter((m) => m.status !== "cancelled")
      .map(maintenanceToEvent)
      .filter((e): e is CalendarEvent => e !== null);
    events.push(...mapped);
  }

  return events;
}

export function useCalendarEventsMock(selectedListings: string[], submenuFilters: string[]) {
  return useMemo(
    () =>
      computeEvents(
        mockBookingList,
        mockVacancyList,
        mockMaintenanceList,
        selectedListings,
        submenuFilters,
      ),
    [selectedListings, submenuFilters],
  );
}
