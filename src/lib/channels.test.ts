import { describe, expect, it } from "vitest";

import { CHANNEL_LABELS, formatChannel } from "./channels";

describe("formatChannel", () => {
  it("maps known channel keys to display labels", () => {
    expect(formatChannel("airbnb")).toBe("Airbnb");
    expect(formatChannel("booking_com")).toBe("Booking.com");
    expect(formatChannel("vrbo")).toBe("VRBO");
    expect(formatChannel("direct")).toBe("Direct");
  });

  it("falls back to the raw value for unknown channels", () => {
    expect(formatChannel("unknown_channel")).toBe("unknown_channel");
    expect(formatChannel("")).toBe("");
  });
});

describe("CHANNEL_LABELS", () => {
  it("has the four canonical channel keys", () => {
    expect(Object.keys(CHANNEL_LABELS).sort()).toEqual([
      "airbnb",
      "booking_com",
      "direct",
      "vrbo",
    ]);
  });
});
