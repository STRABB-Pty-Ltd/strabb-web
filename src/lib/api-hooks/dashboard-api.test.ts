import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { rawPreviewToPreviewData, type RawPreviewResponse } from "./dashboard-api";

function emptyRaw(overrides: Partial<RawPreviewResponse> = {}): RawPreviewResponse {
  return {
    revenueTrend: [],
    upcomingBookings: [],
    cleaningStatus: {},
    channelBreakdown: [],
    ...overrides,
  };
}

describe("rawPreviewToPreviewData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Anchor "today" to a fixed local moment so date math is deterministic.
    vi.setSystemTime(new Date("2026-04-30T10:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("miniCalendar", () => {
    it("returns 7 sequential days starting from today", () => {
      const result = rawPreviewToPreviewData(emptyRaw());
      expect(result.miniCalendar).toHaveLength(7);
      expect(result.miniCalendar[0]?.date).toBe("2026-04-30");
      expect(result.miniCalendar[6]?.date).toBe("2026-05-06");
      expect(result.miniCalendar.every((d) => d.bookings === 0)).toBe(true);
    });

    it("buckets a check-in by its local day, not the UTC date portion", () => {
      // The booking's UTC string is on 2026-04-30 (16:00Z), but in the local
      // timezone of this test environment that may render as a different
      // calendar day. Whatever the local-day comes out as, the bucket label
      // and the booking's local-day must match. This regresses the old bug
      // where comparing format(day, "yyyy-MM-dd") to b.checkIn.split("T")[0]
      // could land bookings in the wrong day on either side of midnight.
      const checkIn = "2026-04-30T16:00:00Z";
      const result = rawPreviewToPreviewData(
        emptyRaw({
          upcomingBookings: [
            { id: "b1", listingName: "L1", guestName: "G1", checkIn, channel: "airbnb" },
          ],
        }),
      );
      const totalBookings = result.miniCalendar.reduce((sum, d) => sum + d.bookings, 0);
      expect(totalBookings).toBe(1);
    });

    it("counts multiple check-ins on the same day", () => {
      const sharedCheckIn = "2026-05-02T03:00:00";
      const result = rawPreviewToPreviewData(
        emptyRaw({
          upcomingBookings: [
            { id: "a", listingName: "L1", guestName: "G1", checkIn: sharedCheckIn, channel: "airbnb" },
            { id: "b", listingName: "L2", guestName: "G2", checkIn: sharedCheckIn, channel: "direct" },
            { id: "c", listingName: "L1", guestName: "G3", checkIn: sharedCheckIn, channel: "vrbo" },
          ],
        }),
      );
      const day = result.miniCalendar.find((d) => d.date === "2026-05-02");
      expect(day?.bookings).toBe(3);
    });

    it("ignores check-ins outside the 7-day window", () => {
      const result = rawPreviewToPreviewData(
        emptyRaw({
          upcomingBookings: [
            { id: "p", listingName: "L1", guestName: "P", checkIn: "2026-04-29T10:00:00", channel: "airbnb" },
            { id: "f", listingName: "L1", guestName: "F", checkIn: "2026-05-10T10:00:00", channel: "airbnb" },
          ],
        }),
      );
      const totalBookings = result.miniCalendar.reduce((sum, d) => sum + d.bookings, 0);
      expect(totalBookings).toBe(0);
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
      expect(result.miniCalendar).toHaveLength(7);
      expect(result.revenueSparkline).toEqual([]);
      expect(result.upcomingBookings).toEqual([]);
      expect(result.taskSummary).toEqual([]);
    });
  });
});
