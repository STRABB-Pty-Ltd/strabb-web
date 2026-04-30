import { describe, expect, it } from "vitest";

import { rawPreviewToPreviewData, type RawPreviewResponse } from "./dashboard-api";

function emptyRaw(overrides: Partial<RawPreviewResponse> = {}): RawPreviewResponse {
  return {
    miniCalendar: [],
    revenueTrend: [],
    upcomingBookings: [],
    cleaningStatus: {},
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

  describe("taskSummary", () => {
    it("maps status counts and assigns colors from the status palette", () => {
      const result = rawPreviewToPreviewData(
        emptyRaw({ cleaningStatus: { pending: 3, completed: 5 } }),
      );
      expect(result.taskSummary).toEqual([
        { status: "pending", count: 3, color: "var(--status-pending)" },
        { status: "completed", count: 5, color: "var(--status-completed)" },
      ]);
    });

    it("falls back to brand color for unknown statuses", () => {
      const result = rawPreviewToPreviewData(
        emptyRaw({ cleaningStatus: { weird_status: 1 } }),
      );
      expect(result.taskSummary[0]?.color).toBe("var(--brand-10)");
    });
  });

  describe("missing fields", () => {
    it("treats missing arrays/maps as empty", () => {
      const result = rawPreviewToPreviewData({} as RawPreviewResponse);
      expect(result.miniCalendar).toEqual([]);
      expect(result.revenueSparkline).toEqual([]);
      expect(result.upcomingBookings).toEqual([]);
      expect(result.taskSummary).toEqual([]);
    });
  });
});
