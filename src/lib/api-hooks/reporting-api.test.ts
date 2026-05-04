import { describe, expect, it } from "vitest";

import { financialsToRevenueTrend, type RawFinancial } from "./reporting-api";

function fin(month: string, listingId: string, revenue: number): RawFinancial {
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
  };
}

describe("financialsToRevenueTrend", () => {
  it("returns an empty series when given no rows", () => {
    expect(financialsToRevenueTrend([])).toEqual([]);
  });

  it("sums revenue per month across listings", () => {
    const rows = [
      fin("2026-03", "a", 1000),
      fin("2026-03", "b", 500),
      fin("2026-04", "a", 1200),
    ];
    expect(financialsToRevenueTrend(rows)).toEqual([
      { label: "2026-03", revenue: 1500 },
      { label: "2026-04", revenue: 1200 },
    ]);
  });

  it("sorts months ascending regardless of input order", () => {
    const rows = [fin("2026-05", "a", 100), fin("2025-12", "a", 200), fin("2026-01", "a", 50)];
    const result = financialsToRevenueTrend(rows);
    expect(result.map((r) => r.label)).toEqual(["2025-12", "2026-01", "2026-05"]);
  });

  it("preserves zero-revenue months that the API returned", () => {
    const rows = [fin("2026-03", "a", 0), fin("2026-04", "a", 100)];
    expect(financialsToRevenueTrend(rows)).toEqual([
      { label: "2026-03", revenue: 0 },
      { label: "2026-04", revenue: 100 },
    ]);
  });
});
