"use client";

import { useMemo } from "react";

import { mockBookingList, mockFinancialList, mockListingList } from "./index";
import type { Financial } from "@/types/financial";

export interface ReportingKPI {
  label: string;
  value: number;
  type: "currency" | "number" | "percentage";
  trend: number;
  icon: string;
}

export interface ChartDataSet {
  revenueTrend: { label: string; revenue: number }[];
  channelBreakdown: {
    channel: string;
    revenue: number;
    percentage: number;
    color: string;
  }[];
  occupancy: { listing: string; occupancy: number }[];
  expenses: { category: string; amount: number }[];
  revenueByListing: { listing: string; revenue: number; color: string }[];
}

const channelColors: Record<string, string> = {
  airbnb: "var(--channel-airbnb)",
  booking_com: "var(--channel-booking)",
  vrbo: "var(--channel-vrbo)",
  direct: "var(--channel-direct)",
};

const channelLabels: Record<string, string> = {
  airbnb: "Airbnb",
  booking_com: "Booking.com",
  vrbo: "VRBO",
  direct: "Direct",
};

function computeKPIs(financials: Financial[], selectedListings: string[]): ReportingKPI[] {
  const filtered =
    selectedListings.length > 0
      ? financials.filter((f) => selectedListings.includes(f.listingId))
      : financials;

  const months = [...new Set(filtered.map((f) => f.month))].sort();
  const currentMonth = months[months.length - 1] ?? "";
  const prevMonth = months[months.length - 2] ?? "";

  const current = filtered.filter((f) => f.month === currentMonth);
  const prev = filtered.filter((f) => f.month === prevMonth);

  const totalRevenue = current.reduce((s, f) => s + f.revenue, 0);
  const prevRevenue = prev.reduce((s, f) => s + f.revenue, 0);
  const revTrend =
    prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : 0;

  const avgOccupancy =
    current.length > 0
      ? Math.round(current.reduce((s, f) => s + f.occupancyRate, 0) / current.length)
      : 0;

  const totalBookings = current.reduce((s, f) => s + f.bookingCount, 0);

  const avgRate =
    current.length > 0
      ? Math.round(current.reduce((s, f) => s + f.avgNightlyRate, 0) / current.length)
      : 0;

  const totalExpenses = current.reduce(
    (s, f) => s + f.cleaningCost + f.ticketCost + f.suppliesCost + f.platformFees,
    0,
  );

  const netProfit = totalRevenue - totalExpenses;

  return [
    {
      label: "Total Revenue",
      value: totalRevenue,
      type: "currency",
      trend: revTrend,
      icon: "dollar-sign",
    },
    {
      label: "Avg Occupancy",
      value: avgOccupancy,
      type: "percentage",
      trend: 2.3,
      icon: "percent",
    },
    { label: "Total Bookings", value: totalBookings, type: "number", trend: 5.1, icon: "calendar" },
    { label: "Avg Nightly Rate", value: avgRate, type: "currency", trend: 3.5, icon: "bed" },
    {
      label: "Total Expenses",
      value: totalExpenses,
      type: "currency",
      trend: -4.2,
      icon: "credit-card",
    },
    {
      label: "Net Profit",
      value: netProfit,
      type: "currency",
      trend: revTrend + 2,
      icon: "trending-up",
    },
  ];
}

function computeChartData(financials: Financial[], selectedListings: string[]): ChartDataSet {
  const filtered =
    selectedListings.length > 0
      ? financials.filter((f) => selectedListings.includes(f.listingId))
      : financials;

  const months = [...new Set(filtered.map((f) => f.month))].sort();
  const revenueTrend = months.map((month) => ({
    label: month,
    revenue: filtered.filter((f) => f.month === month).reduce((s, f) => s + f.revenue, 0),
  }));

  const channelRevenue: Record<string, number> = {};
  for (const b of mockBookingList) {
    if (selectedListings.length > 0 && !selectedListings.includes(b.listingId)) continue;
    if (b.status === "cancelled") continue;
    channelRevenue[b.channel] = (channelRevenue[b.channel] ?? 0) + b.totalAmount;
  }
  const totalChannelRev = Object.values(channelRevenue).reduce((s, v) => s + v, 0);
  const channelBreakdown = Object.entries(channelRevenue).map(([ch, rev]) => ({
    channel: channelLabels[ch] ?? ch,
    revenue: rev,
    percentage: totalChannelRev > 0 ? Math.round((rev / totalChannelRev) * 100) : 0,
    color: channelColors[ch] ?? "var(--channel-direct)",
  }));

  const latestMonth = months[months.length - 1] ?? "";
  const latestData = filtered.filter((f) => f.month === latestMonth);
  const occupancy = latestData.map((f) => ({
    listing: f.listingName.replace(/.*- /, "").substring(0, 15),
    occupancy: f.occupancyRate,
  }));

  const totalCleaning = latestData.reduce((s, f) => s + f.cleaningCost, 0);
  const totalTickets = latestData.reduce((s, f) => s + f.ticketCost, 0);
  const totalSupplies = latestData.reduce((s, f) => s + f.suppliesCost, 0);
  const totalFees = latestData.reduce((s, f) => s + f.platformFees, 0);
  const expenses = [
    { category: "Cleaning", amount: totalCleaning },
    { category: "Tickets", amount: totalTickets },
    { category: "Supplies", amount: totalSupplies },
    { category: "Platform Fees", amount: totalFees },
  ];

  const listingMap = new Map(mockListingList.map((l) => [l.id, l.color]));
  const revenueByListing = latestData.map((f) => ({
    listing: f.listingName.replace(/.*- /, "").substring(0, 15),
    revenue: f.revenue,
    color: listingMap.get(f.listingId) ?? "var(--brand-10)",
  }));

  return { revenueTrend, channelBreakdown, occupancy, expenses, revenueByListing };
}

export function useReportingKPIsMock(selectedListings: string[]) {
  return useMemo(() => computeKPIs(mockFinancialList, selectedListings), [selectedListings]);
}

export function useReportingChartDataMock(selectedListings: string[]) {
  return useMemo(() => computeChartData(mockFinancialList, selectedListings), [selectedListings]);
}
