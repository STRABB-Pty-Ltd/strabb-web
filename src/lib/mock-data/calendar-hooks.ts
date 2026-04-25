"use client";

import { addHours } from "date-fns";
import { useMemo } from "react";

import {
  mockBookingList,
  mockCleaningTaskList,
  mockListingList,
  mockTicketsList,
  mockVacancyList,
} from "./index";
import type { Booking } from "@/types/booking";
import type { CleaningTask } from "@/types/cleaning-task";
import type { Ticket } from "@/types/ticket";
import type { Vacancy } from "@/types/vacancy";

const listingNamesById: Record<string, string> = Object.fromEntries(
  mockListingList.map((l) => [l.id, l.name]),
);

export type CalendarEventType = "booking" | "vacancy" | "ticket" | "cleaning";

const cleaningTypeLabels: Record<string, string> = {
  turnover: "Turnover",
  checkout: "Checkout clean",
  checkin: "Check-in prep",
  deep_clean: "Deep clean",
  mid_stay: "Mid-stay",
  inspection: "Inspection",
};

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

function cleaningToEvent(t: CleaningTask): CalendarEvent {
  const start = new Date(t.scheduledTime);
  const end = addHours(start, Math.max(1, t.estimatedHours));
  const label = cleaningTypeLabels[t.type] ?? t.type;
  return {
    id: t.id,
    type: "cleaning",
    listingId: t.listingId,
    listingName: t.listingName,
    label: t.assigneeName ? `${label} — ${t.assigneeName}` : label,
    start: start.toISOString(),
    end: end.toISOString(),
    color: "var(--status-success)",
    status: t.status,
  };
}

function ticketToEvent(t: Ticket): CalendarEvent | null {
  if (!t.listingId) return null;
  const listingName = listingNamesById[t.listingId] ?? t.listingId;
  const start = t.dateScheduled ?? t.dateReported;
  const end = t.dateScheduled ?? t.dateReported;
  return {
    id: t.id,
    type: "ticket",
    listingId: t.listingId,
    listingName,
    label: `${t.description} — ${listingName}`,
    start,
    end,
    color: "var(--status-danger)",
    status: t.status,
  };
}

function computeEvents(
  bookings: Booking[],
  vacancies: Vacancy[],
  tickets: Ticket[],
  cleanings: CleaningTask[],
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

  if (showAll || submenuFilters.includes("cleaning")) {
    const filtered = filterByListing
      ? cleanings.filter((c) => selectedListings.includes(c.listingId))
      : cleanings;
    events.push(...filtered.filter((c) => c.status !== "cancelled").map(cleaningToEvent));
  }

  if (submenuFilters.includes("vacancy")) {
    const filtered = filterByListing
      ? vacancies.filter((v) => selectedListings.includes(v.listingId))
      : vacancies;
    events.push(...filtered.map(vacancyToEvent));
  }

  if (showAll || submenuFilters.includes("ticket")) {
    const filtered = filterByListing
      ? tickets.filter((t) => t.listingId && selectedListings.includes(t.listingId))
      : tickets;
    const mapped = filtered
      .filter((t) => t.status !== "cancelled")
      .map(ticketToEvent)
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
        mockTicketsList,
        mockCleaningTaskList,
        selectedListings,
        submenuFilters,
      ),
    [selectedListings, submenuFilters],
  );
}
