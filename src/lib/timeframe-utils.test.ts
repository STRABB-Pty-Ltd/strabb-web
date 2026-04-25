import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatPeriodLabel,
  ganttDateRange,
  stepAnchor,
  timeframeToDateRange,
} from "./timeframe-utils";

// Wed 15 April 2026, 12:00 local — used to anchor "current" tests
const FROZEN_NOW = new Date(2026, 3, 15, 12, 0, 0);

describe("timeframeToDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("month with no anchor → current month bounds", () => {
    expect(timeframeToDateRange("month")).toEqual({
      startDate: "2026-04-01",
      endDate: "2026-04-30",
    });
  });

  it("month with explicit anchor → snaps to month bounds", () => {
    expect(timeframeToDateRange("month", "2026-01-15")).toEqual({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
  });

  it("week with no anchor → Mon–Sun of current week", () => {
    // Wed 15 → Mon 13 to Sun 19
    expect(timeframeToDateRange("week")).toEqual({
      startDate: "2026-04-13",
      endDate: "2026-04-19",
    });
  });

  it("fortnight with anchor → 14-day span starting at week of anchor", () => {
    expect(timeframeToDateRange("fortnight", "2026-04-13")).toEqual({
      startDate: "2026-04-13",
      endDate: "2026-04-26",
    });
  });

  it("quarter with no anchor → Q2 2026", () => {
    expect(timeframeToDateRange("quarter")).toEqual({
      startDate: "2026-04-01",
      endDate: "2026-06-30",
    });
  });

  it("year with anchor → that calendar year", () => {
    expect(timeframeToDateRange("year", "2025-06-01")).toEqual({
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    });
  });

  it("ytd → start of current year to today", () => {
    expect(timeframeToDateRange("ytd")).toEqual({
      startDate: "2026-01-01",
      endDate: "2026-04-15",
    });
  });

  it("custom with range → uses the range", () => {
    expect(
      timeframeToDateRange("custom", null, { start: "2026-02-10", end: "2026-03-20" }),
    ).toEqual({
      startDate: "2026-02-10",
      endDate: "2026-03-20",
    });
  });

  it("custom without range → falls back to today", () => {
    expect(timeframeToDateRange("custom")).toEqual({
      startDate: "2026-04-15",
      endDate: "2026-04-15",
    });
  });
});

describe("stepAnchor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("month +1 from null anchor → next month", () => {
    expect(stepAnchor("month", null, 1)).toBe("2026-05-01");
  });

  it("month -1 from explicit anchor → previous month", () => {
    expect(stepAnchor("month", "2026-04-01", -1)).toBe("2026-03-01");
  });

  it("week ±1 → ±7 days from snapped anchor", () => {
    expect(stepAnchor("week", "2026-04-13", 1)).toBe("2026-04-20");
    expect(stepAnchor("week", "2026-04-13", -1)).toBe("2026-04-06");
  });

  it("fortnight ±1 → ±14 days", () => {
    expect(stepAnchor("fortnight", "2026-04-13", 1)).toBe("2026-04-27");
  });

  it("quarter ±1 → ±3 months snapped", () => {
    expect(stepAnchor("quarter", "2026-04-01", -1)).toBe("2026-01-01");
  });

  it("year ±1 → ±1 calendar year", () => {
    expect(stepAnchor("year", "2026-01-01", 1)).toBe("2027-01-01");
  });

  it("ytd does not step", () => {
    expect(stepAnchor("ytd", null, 1)).toBeNull();
  });

  it("custom does not step", () => {
    expect(stepAnchor("custom", null, -1)).toBeNull();
  });
});

describe("ganttDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("anchor=null + fortnight → today-2 to today+11", () => {
    expect(ganttDateRange("fortnight", null)).toEqual({
      startDate: "2026-04-13",
      endDate: "2026-04-26",
    });
  });

  it("anchor=null + week → today-2 to today+4", () => {
    expect(ganttDateRange("week", null)).toEqual({
      startDate: "2026-04-13",
      endDate: "2026-04-19",
    });
  });

  it("anchor=null + month → today-2 plus ~30 days", () => {
    expect(ganttDateRange("month", null)).toEqual({
      startDate: "2026-04-13",
      endDate: "2026-05-12",
    });
  });

  it("anchor set → falls back to standard period range", () => {
    expect(ganttDateRange("month", "2026-01-01")).toEqual({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
  });

  it("custom + range → uses range directly", () => {
    expect(ganttDateRange("custom", null, { start: "2026-02-10", end: "2026-03-20" })).toEqual({
      startDate: "2026-02-10",
      endDate: "2026-03-20",
    });
  });
});

describe("formatPeriodLabel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("month → 'April 2026'", () => {
    expect(formatPeriodLabel("month", "2026-04-01")).toBe("April 2026");
  });

  it("quarter → 'Q2 2026'", () => {
    expect(formatPeriodLabel("quarter", "2026-04-01")).toBe("Q2 2026");
  });

  it("year → '2026'", () => {
    expect(formatPeriodLabel("year", "2026-01-01")).toBe("2026");
  });

  it("ytd → 'Year to date'", () => {
    expect(formatPeriodLabel("ytd", null)).toBe("Year to date");
  });

  it("day → full readable date", () => {
    expect(formatPeriodLabel("day", "2026-04-15")).toBe("Wednesday, 15 April 2026");
  });

  it("week within one month → '13–19 April 2026'", () => {
    expect(formatPeriodLabel("week", "2026-04-13")).toBe("13–19 April 2026");
  });

  it("custom with range → 'd MMM yyyy – d MMM yyyy'", () => {
    expect(formatPeriodLabel("custom", null, { start: "2026-02-10", end: "2026-03-20" })).toBe(
      "10 Feb 2026 – 20 Mar 2026",
    );
  });

  it("custom without range → 'Custom range'", () => {
    expect(formatPeriodLabel("custom", null)).toBe("Custom range");
  });
});
