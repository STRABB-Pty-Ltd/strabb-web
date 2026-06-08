import { describe, expect, it } from "vitest";

import {
  enumerateMonths,
  financialsToRevenueTrend,
  rawFinancialsToKPIs,
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

function kpi(rows: RawFinancial[], label: string) {
  const found = rawFinancialsToKPIs(rows).find((k) => k.label === label);
  if (!found) throw new Error(`KPI not found: ${label}`);
  return found;
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

describe("rawFinancialsToKPIs", () => {
  it("computes a weighted average nightly rate (revenue / nights), not an average of averages", () => {
    const rows = [
      fin("2026-01", "a", 1000, { nights: 10, avgNightlyRate: 100 }),
      fin("2026-01", "b", 600, { nights: 5, avgNightlyRate: 120 }),
    ];
    // Average of averages would be (100 + 120) / 2 = 110.
    // Weighted is total revenue / total nights = 1600 / 15 = 106.67.
    expect(kpi(rows, "Avg $/night").value).toBe(106.67);
  });

  it("returns 0 for avg nightly rate when there are no room-nights", () => {
    const rows = [fin("2026-01", "a", 0, { nights: 0 })];
    expect(kpi(rows, "Avg $/night").value).toBe(0);
  });

  it("returns zeroed KPIs in a stable order for an empty record set", () => {
    const kpis = rawFinancialsToKPIs([]);
    expect(kpis.map((k) => k.label)).toEqual([
      "Total Revenue",
      "Net Income",
      "Total Expenses",
      "Avg Occupancy",
      "Avg $/night",
      "Total Bookings",
    ]);
    for (const k of kpis) expect(k.value).toBe(0);
  });

  it("sums revenue, expenses, net income and bookings across records", () => {
    const rows = [
      fin("2026-01", "a", 1000, {
        nights: 10,
        cleaningCost: 100,
        ticketCost: 50,
        suppliesCost: 20,
        platformFees: 30,
        netIncome: 800,
        bookingCount: 2,
      }),
      fin("2026-02", "a", 500, {
        nights: 5,
        platformFees: 15,
        netIncome: 485,
        bookingCount: 1,
      }),
    ];
    expect(kpi(rows, "Total Revenue").value).toBe(1500);
    expect(kpi(rows, "Total Expenses").value).toBe(215); // 100+50+20+30 + 15
    expect(kpi(rows, "Net Income").value).toBe(1285); // 800 + 485
    expect(kpi(rows, "Total Bookings").value).toBe(3);
  });
});
