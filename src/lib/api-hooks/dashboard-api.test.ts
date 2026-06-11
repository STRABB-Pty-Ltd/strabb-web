import { describe, expect, it } from "vitest";

import {
  rawAlertsToAlertItems,
  rawKPIsToKPIData,
  rawPreviewToPreviewData,
  type RawAlertResponse,
  type RawKPIReport,
  type RawPreviewResponse,
} from "./dashboard-api";

const KPI_RESPONSE: RawKPIReport = {
  revenue: 17685.0,
  expenses: 2907.35,
  netIncome: 14777.65,
  occupancyRate: 0.5376,
  avgNightlyRate: 333.68,
  totalBookings: 15,
  trends: {
    revenue: null,
    expenses: null,
    netIncome: null,
    occupancyRate: null,
    avgNightlyRate: null,
    totalBookings: null,
  },
};

describe("rawKPIsToKPIData", () => {
  it("passes money values through untouched (no whole-dollar pre-rounding)", () => {
    const byLabel = Object.fromEntries(
      rawKPIsToKPIData(KPI_RESPONSE).map((k) => [k.label, k.value]),
    );
    // Regression: Avg $/night was Math.round()ed to 334 while reporting
    // showed the true 333.68 for the same period.
    expect(byLabel["Avg $/night"]).toBe(333.68);
    expect(byLabel["Total Revenue"]).toBe(17685.0);
    expect(byLabel["Net Income"]).toBe(14777.65);
  });

  it("displays occupancy as a whole percent from the 0..1 decimal, same as reporting", () => {
    const byLabel = Object.fromEntries(
      rawKPIsToKPIData(KPI_RESPONSE).map((k) => [k.label, k.value]),
    );
    expect(byLabel["Avg Occupancy"]).toBe(54);
  });
});

function emptyRaw(overrides: Partial<RawPreviewResponse> = {}): RawPreviewResponse {
  return {
    miniCalendar: [],
    revenueTrend: [],
    upcomingBookings: [],
    cleansAndTickets: [],
    channelBreakdown: [],
    ...overrides,
  };
}

describe("rawPreviewToPreviewData", () => {
  describe("miniCalendar", () => {
    it("returns the API's miniCalendar verbatim", () => {
      const miniCalendar = [
        { date: "2026-04-30", bookings: 2 },
        { date: "2026-05-01", bookings: 0 },
        { date: "2026-05-02", bookings: 3 },
        { date: "2026-05-03", bookings: 1 },
        { date: "2026-05-04", bookings: 0 },
        { date: "2026-05-05", bookings: 0 },
        { date: "2026-05-06", bookings: 4 },
      ];
      const result = rawPreviewToPreviewData(emptyRaw({ miniCalendar }));
      expect(result.miniCalendar).toEqual(miniCalendar);
    });

    it("falls back to an empty array when the API field is missing", () => {
      const result = rawPreviewToPreviewData({} as RawPreviewResponse);
      expect(result.miniCalendar).toEqual([]);
    });
  });

  describe("revenueSparkline", () => {
    it("renames month/amount to label/revenue", () => {
      const result = rawPreviewToPreviewData(
        emptyRaw({
          revenueTrend: [
            { month: "Mar", amount: 4200 },
            { month: "Apr", amount: 5100 },
          ],
        }),
      );
      expect(result.revenueSparkline).toEqual([
        { label: "Mar", revenue: 4200 },
        { label: "Apr", revenue: 5100 },
      ]);
    });
  });

  describe("upcomingBookings", () => {
    it("renames listingName/guestName to listing/guest and preserves the rest", () => {
      const result = rawPreviewToPreviewData(
        emptyRaw({
          upcomingBookings: [
            {
              id: "b1",
              listingName: "Beach House",
              guestName: "Alice",
              checkIn: "2026-05-01T14:00:00Z",
              channel: "airbnb",
            },
          ],
        }),
      );
      expect(result.upcomingBookings).toEqual([
        {
          id: "b1",
          listing: "Beach House",
          guest: "Alice",
          checkIn: "2026-05-01T14:00:00Z",
          channel: "airbnb",
        },
      ]);
    });
  });

  describe("cleansAndTickets", () => {
    it("passes API entries through verbatim", () => {
      const cleansAndTickets = [
        { id: "c1", kind: "clean" as const, listing: "Beach House", date: "2026-05-02" },
        { id: "t1", kind: "ticket" as const, listing: "City Loft", date: "2026-05-03" },
        { id: "c2", kind: "clean" as const, listing: "Beach House", date: "2026-05-05" },
      ];
      const result = rawPreviewToPreviewData(emptyRaw({ cleansAndTickets }));
      expect(result.cleansAndTickets).toEqual(cleansAndTickets);
    });
  });

  describe("missing fields", () => {
    it("treats missing arrays/maps as empty", () => {
      const result = rawPreviewToPreviewData({} as RawPreviewResponse);
      expect(result.miniCalendar).toEqual([]);
      expect(result.revenueSparkline).toEqual([]);
      expect(result.upcomingBookings).toEqual([]);
      expect(result.cleansAndTickets).toEqual([]);
    });
  });
});

describe("rawAlertsToAlertItems", () => {
  function makeRaw(overrides: Partial<RawAlertResponse> = {}): RawAlertResponse {
    return {
      unreadMessages: 0,
      unscheduledCleans: 0,
      pastDueCleans: 0,
      urgentTickets: 0,
      syncErrors: 0,
      ...overrides,
    };
  }

  it("renders all five alert chips with the correct counts", () => {
    const items = rawAlertsToAlertItems(
      makeRaw({
        unreadMessages: 3,
        unscheduledCleans: 5,
        pastDueCleans: 4,
        urgentTickets: 2,
        syncErrors: 1,
      }),
    );
    expect(items).toHaveLength(5);
    expect(items[0]).toMatchObject({ id: "alert-messages", count: 3 });
    expect(items[1]).toMatchObject({ id: "alert-unscheduled", count: 5 });
    expect(items[2]).toMatchObject({ id: "alert-past-due-cleans", count: 4 });
    expect(items[3]).toMatchObject({ id: "alert-tickets", count: 2 });
    expect(items[4]).toMatchObject({ id: "alert-sync", count: 1 });
  });

  it("uses singular nouns when count is exactly 1", () => {
    const items = rawAlertsToAlertItems(
      makeRaw({
        unreadMessages: 1,
        unscheduledCleans: 1,
        pastDueCleans: 1,
        urgentTickets: 1,
        syncErrors: 1,
      }),
    );
    expect(items[0].description).toBe("1 unread message");
    expect(items[1].description).toBe("1 clean need scheduling");
    expect(items[2].description).toBe("1 past-due clean");
    expect(items[3].description).toBe("1 urgent ticket");
    expect(items[4].description).toBe("1 sync error");
  });

  it("defaults missing fields to 0 (defensive against malformed responses)", () => {
    const items = rawAlertsToAlertItems({ unreadMessages: 0 } as RawAlertResponse);
    expect(items.map((i) => i.count)).toEqual([0, 0, 0, 0, 0]);
  });
});
