import { describe, expect, it } from "vitest";

import { type RawKPIReport, type RawKPIValues } from "@/lib/api-hooks/kpi-cards";

import {
  enumerateMonths,
  financialsToRevenueTrend,
  serverKPIsToCards,
  type RawFinancial,
} from "./reporting-api";

function fin(
  month: string,
  listingId: string,
  revenue: number,
  overrides: Partial<RawFinancial> = {},
): RawFinancial {
  return {
    month,
    listingId,
    listingName: `Listing ${listingId}`,
    revenue,
    cleaningCost: 0,
    ticketCost: 0,
    suppliesCost: 0,
    platformFees: 0,
    netIncome: revenue,
    occupancyRate: 0,
    avgNightlyRate: 0,
    bookingCount: 0,
    nights: 0,
    ...overrides,
  };
}

describe("financialsToRevenueTrend", () => {
  it("returns an empty series when given no rows", () => {
    expect(financialsToRevenueTrend([])).toEqual([]);
  });

  it("sums revenue per month across listings", () => {
    const rows = [fin("2026-03", "a", 1000), fin("2026-03", "b", 500), fin("2026-04", "a", 1200)];
    expect(financialsToRevenueTrend(rows)).toEqual([
      { label: "2026-03", revenue: 1500 },
      { label: "2026-04", revenue: 1200 },
    ]);
  });

  it("sorts months ascending and gap-fills regardless of input order", () => {
    const rows = [fin("2026-05", "a", 100), fin("2025-12", "a", 200), fin("2026-01", "a", 50)];
    const result = financialsToRevenueTrend(rows);
    expect(result.map((r) => r.label)).toEqual([
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
    ]);
  });

  it("preserves zero-revenue months that the API returned", () => {
    const rows = [fin("2026-03", "a", 0), fin("2026-04", "a", 100)];
    expect(financialsToRevenueTrend(rows)).toEqual([
      { label: "2026-03", revenue: 0 },
      { label: "2026-04", revenue: 100 },
    ]);
  });

  it("gap-fills missing months between first and last with zero revenue", () => {
    const rows = [fin("2025-10", "a", 800), fin("2026-01", "a", 1200)];
    expect(financialsToRevenueTrend(rows)).toEqual([
      { label: "2025-10", revenue: 800 },
      { label: "2025-11", revenue: 0 },
      { label: "2025-12", revenue: 0 },
      { label: "2026-01", revenue: 1200 },
    ]);
  });

  it("crosses year boundaries when gap-filling", () => {
    const rows = [fin("2025-11", "a", 100), fin("2026-02", "a", 200)];
    const labels = financialsToRevenueTrend(rows).map((r) => r.label);
    expect(labels).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("enumerateMonths", () => {
  it("enumerates inclusive of both endpoints in the same year", () => {
    expect(enumerateMonths("2026-02", "2026-05")).toEqual([
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
    ]);
  });

  it("crosses years correctly", () => {
    expect(enumerateMonths("2025-11", "2026-02")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("returns a single entry when start equals end", () => {
    expect(enumerateMonths("2026-04", "2026-04")).toEqual(["2026-04"]);
  });

  it("returns an empty array on malformed input", () => {
    expect(enumerateMonths("nope", "2026-01")).toEqual([]);
  });
});

function values(overrides: Partial<RawKPIValues> = {}): RawKPIValues {
  return {
    revenue: 0,
    expenses: 0,
    netIncome: 0,
    occupancyRate: 0,
    avgNightlyRate: 0,
    totalBookings: 0,
    ...overrides,
  };
}

function serverKPIs(
  current: Partial<RawKPIValues> = {},
  trends: RawKPIReport["trends"] = {
    revenue: null,
    expenses: null,
    netIncome: null,
    occupancyRate: null,
    avgNightlyRate: null,
    totalBookings: null,
  },
): RawKPIReport {
  return { ...values(current), trends };
}

describe("serverKPIsToCards", () => {
  it("maps the server values onto the six cards in a stable order", () => {
    const cards = serverKPIsToCards(
      serverKPIs({
        revenue: 1500,
        expenses: 215,
        netIncome: 1285,
        occupancyRate: 0.3226,
        avgNightlyRate: 106.67,
        totalBookings: 3,
      }),
    );
    expect(cards.map((k) => k.label)).toEqual([
      "Total Revenue",
      "Net Income",
      "Total Expenses",
      "Avg Occupancy",
      "Avg $/night",
      "Total Bookings",
    ]);
    const byLabel = Object.fromEntries(cards.map((k) => [k.label, k.value]));
    expect(byLabel["Total Revenue"]).toBe(1500);
    expect(byLabel["Net Income"]).toBe(1285);
    expect(byLabel["Total Expenses"]).toBe(215);
    expect(byLabel["Avg $/night"]).toBe(106.67);
    expect(byLabel["Total Bookings"]).toBe(3);
  });

  it("displays occupancy as a whole percent from the 0..1 decimal", () => {
    const cards = serverKPIsToCards(serverKPIs({ occupancyRate: 0.3226 }));
    expect(cards.find((k) => k.label === "Avg Occupancy")?.value).toBe(32);
  });

  it("overlays each trend delta onto the matching card", () => {
    const cards = serverKPIsToCards(
      serverKPIs(
        {},
        {
          revenue: 12.5,
          netIncome: -3.1,
          expenses: 4,
          occupancyRate: 8,
          avgNightlyRate: 1.2,
          totalBookings: 50,
        },
      ),
    );
    const byLabel = Object.fromEntries(cards.map((k) => [k.label, k.trend]));
    expect(byLabel["Total Revenue"]).toBe(12.5);
    expect(byLabel["Net Income"]).toBe(-3.1);
    expect(byLabel["Total Expenses"]).toBe(4);
    expect(byLabel["Avg Occupancy"]).toBe(8);
    expect(byLabel["Avg $/night"]).toBe(1.2);
    expect(byLabel["Total Bookings"]).toBe(50);
  });

  it("keeps a null delta as null (no arrow) but preserves a real 0%", () => {
    const cards = serverKPIsToCards(
      serverKPIs(
        {},
        {
          revenue: null,
          netIncome: 0,
          expenses: null,
          occupancyRate: null,
          avgNightlyRate: null,
          totalBookings: null,
        },
      ),
    );
    const byLabel = Object.fromEntries(cards.map((k) => [k.label, k.trend]));
    expect(byLabel["Total Revenue"]).toBeNull();
    expect(byLabel["Net Income"]).toBe(0);
  });

  it("returns zeroed cards for an empty period", () => {
    const cards = serverKPIsToCards(serverKPIs());
    for (const k of cards) {
      expect(k.value).toBe(0);
      expect(k.trend).toBeNull();
    }
  });

  it("degrades to no arrows when the trends object itself is missing", () => {
    // The api contract guarantees trends today; this pins the defensive
    // t?. path in case that contract ever loosens.
    const raw = { ...values() } as RawKPIReport;
    const cards = serverKPIsToCards(raw);
    for (const k of cards) {
      expect(k.trend).toBeNull();
    }
  });
});
