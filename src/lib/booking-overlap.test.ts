import { describe, expect, it } from "vitest";

import { findOverlappingBooking } from "./booking-overlap";
import type { BookingResponse } from "@/lib/schemas/booking";

function booking(overrides: Partial<BookingResponse>): BookingResponse {
  return {
    id: "b-1",
    listingId: "l-1",
    checkIn: "2026-08-10T00:00:00Z",
    checkOut: "2026-08-13T00:00:00Z",
    status: "confirmed",
    ...overrides,
  } as BookingResponse;
}

describe("findOverlappingBooking", () => {
  it("finds a confirmed booking overlapping the proposed span", () => {
    const hit = findOverlappingBooking(
      [booking({})],
      "2026-08-12T00:00:00Z",
      "2026-08-15T00:00:00Z",
    );
    expect(hit?.id).toBe("b-1");
  });

  it("returns null when there is no overlap (adjacent spans, half-open)", () => {
    // Existing checkout 13th = proposed check-in 13th: a legal turnover.
    const hit = findOverlappingBooking(
      [booking({})],
      "2026-08-13T00:00:00Z",
      "2026-08-16T00:00:00Z",
    );
    expect(hit).toBeNull();
  });

  it("ignores cancelled and checked_out bookings", () => {
    const hits = findOverlappingBooking(
      [booking({ status: "cancelled" }), booking({ id: "b-2", status: "checked_out" })],
      "2026-08-11T00:00:00Z",
      "2026-08-12T00:00:00Z",
    );
    expect(hits).toBeNull();
  });

  it("excludes the booking being edited", () => {
    const hit = findOverlappingBooking(
      [booking({})],
      "2026-08-11T00:00:00Z",
      "2026-08-12T00:00:00Z",
      "b-1",
    );
    expect(hit).toBeNull();
  });

  it("returns null for an invalid or reversed proposed span", () => {
    expect(findOverlappingBooking([booking({})], "", "2026-08-15T00:00:00Z")).toBeNull();
    expect(
      findOverlappingBooking([booking({})], "2026-08-15T00:00:00Z", "2026-08-12T00:00:00Z"),
    ).toBeNull();
  });

  it("skips bookings with unparseable dates rather than warning falsely", () => {
    const hit = findOverlappingBooking(
      [booking({ checkIn: "not-a-date" })],
      "2026-08-11T00:00:00Z",
      "2026-08-12T00:00:00Z",
    );
    expect(hit).toBeNull();
  });
});
