"use client";

import { useMemo } from "react";

import { mockBookingList, mockCleaningTaskList, mockFinancialList, mockMessageList } from "./index";
import { mockTicketsList } from "./ticket";
import { REFERENCE_NOW } from "./reference-date";
import type { Booking } from "@/types/booking";
import type { CleaningTask } from "@/types/cleaning-task";
import type { Financial } from "@/types/financial";
import type { Message } from "@/types/message";
import type { Ticket } from "@/types/ticket";

export interface KPIData {
  label: string;
  value: string | number;
  icon: string;
  trend?: number | null;
  type: "currency" | "number" | "percentage";
}

export interface AlertItem {
  id: string;
  type: "message" | "unscheduled" | "ticket" | "sync";
  severity: "red" | "amber" | "blue";
  description: string;
  count: number;
}

export interface PreviewData {
  miniCalendar: { date: string; bookings: number }[];
  revenueSparkline: { label: string; revenue: number }[];
  upcomingBookings: {
    id: string;
    guest: string;
    listing: string;
    checkIn: string;
    channel: string;
  }[];
  taskSummary: { status: string; count: number; color: string }[];
}

function computeKPIs(
  financials: Financial[],
  selectedListings: string[],
): KPIData[] {
  const filteredFinancials =
    selectedListings.length > 0
      ? financials.filter((f) => selectedListings.includes(f.listingId))
      : financials;

  const months = [...new Set(filteredFinancials.map((f) => f.month))].sort();
  const currentMonth = months[months.length - 1] ?? "";
  const prevMonth = months[months.length - 2] ?? "";

  const currentFinancials = filteredFinancials.filter((f) => f.month === currentMonth);
  const prevFinancials = filteredFinancials.filter((f) => f.month === prevMonth);

  const totalRevenue = currentFinancials.reduce((s, f) => s + f.revenue, 0);
  const prevRevenue = prevFinancials.reduce((s, f) => s + f.revenue, 0);
  const revenueTrend =
    prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : 0;

  const sumExpenses = (rows: Financial[]) =>
    rows.reduce(
      (s, f) => s + f.cleaningCost + f.ticketCost + f.suppliesCost + f.platformFees,
      0,
    );
  const netIncome = totalRevenue - sumExpenses(currentFinancials);
  const prevNetIncome = prevRevenue - sumExpenses(prevFinancials);
  const netIncomeTrend =
    prevNetIncome > 0
      ? Math.round(((netIncome - prevNetIncome) / prevNetIncome) * 1000) / 10
      : 0;

  const avgOccupancy =
    currentFinancials.length > 0
      ? Math.round(
          currentFinancials.reduce((s, f) => s + f.occupancyRate, 0) / currentFinancials.length,
        )
      : 0;
  const prevAvgOccupancy =
    prevFinancials.length > 0
      ? Math.round(prevFinancials.reduce((s, f) => s + f.occupancyRate, 0) / prevFinancials.length)
      : 0;
  const occupancyTrend =
    prevAvgOccupancy > 0
      ? Math.round(((avgOccupancy - prevAvgOccupancy) / prevAvgOccupancy) * 1000) / 10
      : 0;

  const avgNightlyRate =
    currentFinancials.length > 0
      ? Math.round(
          currentFinancials.reduce((s, f) => s + f.avgNightlyRate, 0) / currentFinancials.length,
        )
      : 0;

  return [
    {
      label: "Total Revenue",
      value: totalRevenue,
      icon: "dollar-sign",
      trend: revenueTrend,
      type: "currency",
    },
    {
      label: "Net Income",
      value: netIncome,
      icon: "trending-up",
      trend: netIncomeTrend,
      type: "currency",
    },
    {
      label: "Avg Occupancy",
      value: avgOccupancy,
      icon: "percent",
      trend: occupancyTrend,
      type: "percentage",
    },
    {
      label: "Avg Nightly Rate",
      value: avgNightlyRate,
      icon: "bed",
      trend: 3.5,
      type: "currency",
    },
  ];
}

const MOCK_SYNC_ERROR_COUNT: number = 2;

function computeAlerts(
  tasks: CleaningTask[],
  messages: Message[],
  tickets: Ticket[],
  selectedListings: string[],
): AlertItem[] {
  const alerts: AlertItem[] = [];

  const filteredMessages =
    selectedListings.length > 0
      ? messages.filter((m) => selectedListings.includes(m.listingId))
      : messages;
  const filteredTasks =
    selectedListings.length > 0
      ? tasks.filter((t) => selectedListings.includes(t.listingId))
      : tasks;
  const filteredTickets =
    selectedListings.length > 0
      ? tickets.filter((t) => t.listingId !== null && selectedListings.includes(t.listingId))
      : tickets;

  const unread = filteredMessages.filter((m) => m.status === "unread");
  alerts.push({
    id: "alert-messages",
    type: "message",
    severity: "blue",
    description: `${unread.length} unread message${unread.length === 1 ? "" : "s"}`,
    count: unread.length,
  });

  const needsScheduling = filteredTasks.filter(
    (t) =>
      t.status === "pending" &&
      t.assigneeName === null &&
      new Date(t.scheduledTime) >= REFERENCE_NOW,
  );
  alerts.push({
    id: "alert-unscheduled",
    type: "unscheduled",
    severity: "amber",
    description: `${needsScheduling.length} clean${needsScheduling.length === 1 ? "" : "s"} need scheduling`,
    count: needsScheduling.length,
  });

  const urgentTickets = filteredTickets.filter(
    (t) =>
      (t.priority === "urgent" || t.priority === "high") &&
      (t.status === "pending" || t.status === "confirmed"),
  );
  alerts.push({
    id: "alert-tickets",
    type: "ticket",
    severity: "red",
    description: `${urgentTickets.length} urgent ticket${urgentTickets.length === 1 ? "" : "s"}`,
    count: urgentTickets.length,
  });

  alerts.push({
    id: "alert-sync",
    type: "sync",
    severity: "red",
    description: `${MOCK_SYNC_ERROR_COUNT} sync error${MOCK_SYNC_ERROR_COUNT === 1 ? "" : "s"}`,
    count: MOCK_SYNC_ERROR_COUNT,
  });

  return alerts;
}

function computePreview(
  bookings: Booking[],
  tasks: CleaningTask[],
  financials: Financial[],
  selectedListings: string[],
): PreviewData {
  const now = REFERENCE_NOW;
  const filtered =
    selectedListings.length > 0
      ? bookings.filter((b) => selectedListings.includes(b.listingId))
      : bookings;
  const filteredTasks =
    selectedListings.length > 0
      ? tasks.filter((t) => selectedListings.includes(t.listingId))
      : tasks;
  const filteredFinancials =
    selectedListings.length > 0
      ? financials.filter((f) => selectedListings.includes(f.listingId))
      : financials;

  const miniCalendar = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const count = filtered.filter(
      (b) => b.checkIn <= dateStr && b.checkOut >= dateStr && b.status !== "cancelled",
    ).length;
    return { date: dateStr, bookings: count };
  });

  const months = [...new Set(filteredFinancials.map((f) => f.month))].sort();
  const revenueSparkline = months.map((month) => ({
    label: month,
    revenue: filteredFinancials.filter((f) => f.month === month).reduce((s, f) => s + f.revenue, 0),
  }));

  const upcomingBookings = filtered
    .filter((b) => new Date(b.checkIn) >= now && b.status !== "cancelled")
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      guest: b.guestName,
      listing: b.listingName,
      checkIn: b.checkIn,
      channel: b.channel,
    }));

  const statusCounts: Record<string, { count: number; color: string }> = {
    pending: { count: 0, color: "var(--status-pending)" },
    confirmed: { count: 0, color: "var(--status-confirmed)" },
    in_progress: { count: 0, color: "var(--status-in-progress)" },
    completed: { count: 0, color: "var(--status-completed)" },
    ticket: { count: 0, color: "var(--status-issues)" },
  };
  for (const t of filteredTasks) {
    if (statusCounts[t.status]) statusCounts[t.status].count++;
  }
  const taskSummary = Object.entries(statusCounts).map(([status, { count, color }]) => ({
    status,
    count,
    color,
  }));

  return { miniCalendar, revenueSparkline, upcomingBookings, taskSummary };
}

export function useDashboardKPIsMock(
  windowSize: string,
  anchor: string | null,
  selectedListings: string[],
) {
  return useMemo(
    () => computeKPIs(mockFinancialList, selectedListings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [windowSize, anchor, selectedListings],
  );
}

export function useDashboardAlertsMock(selectedListings: string[]) {
  return useMemo(
    () => computeAlerts(mockCleaningTaskList, mockMessageList, mockTicketsList, selectedListings),
    [selectedListings],
  );
}

export function useDashboardPreviewMock(
  selectedListings: string[],
  windowSize: string,
  anchor: string | null,
) {
  return useMemo(
    () =>
      computePreview(mockBookingList, mockCleaningTaskList, mockFinancialList, selectedListings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedListings, windowSize, anchor],
  );
}
