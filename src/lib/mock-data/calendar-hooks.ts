"use client";

import { useMemo } from "react";

import { mockBookingList, mockMaintenanceList, mockVacancyList } from "./index";
import type { Booking } from "@/types/booking";
import type { Maintenance } from "@/types/maintenance";
import type { Vacancy } from "@/types/vacancy";

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
  airbnb: "#FF5A5F",
  booking_com: "#003580",
  vrbo: "#3B5998",
  direct: "#D97706",
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
    color: channelColors[b.channel] ?? "#6B7280",
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
    color: "#9CA3AF",
  };
}

function maintenanceToEvent(m: Maintenance): CalendarEvent {
  const start = m.dateScheduled ?? m.dateReported;
  const end = m.dateScheduled ?? m.dateReported;
  return {
    id: m.id,
    type: "maintenance",
    listingId: m.listingId,
    listingName: m.listingName,
    label: `${m.description} — ${m.listingName}`,
    start,
    end,
    color: "#D97706",
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

  if (showAll || submenuFilters.includes("vacancy")) {
    const filtered = filterByListing
      ? vacancies.filter((v) => selectedListings.includes(v.listingId))
      : vacancies;
    events.push(...filtered.map(vacancyToEvent));
  }

  if (showAll || submenuFilters.includes("maintenance")) {
    const filtered = filterByListing
      ? maintenance.filter((m) => selectedListings.includes(m.listingId))
      : maintenance;
    events.push(...filtered.filter((m) => m.status !== "cancelled").map(maintenanceToEvent));
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
