import { describe, expect, it } from "vitest";

import { formatMonthLabel, groupByYear } from "./revenue-trend-chart";

describe("formatMonthLabel", () => {
  it("formats YYYY-MM strings as 'MMM yyyy'", () => {
    expect(formatMonthLabel("2025-06")).toBe("Jun 2025");
    expect(formatMonthLabel("2026-01")).toBe("Jan 2026");
    expect(formatMonthLabel("2026-12")).toBe("Dec 2026");
  });

  it("returns the original value when parsing fails", () => {
    expect(formatMonthLabel("not-a-date")).toBe("not-a-date");
    expect(formatMonthLabel("")).toBe("");
  });
});

describe("groupByYear", () => {
  it("groups consecutive months by year in input order", () => {
    expect(groupByYear(["2025-06", "2025-07", "2025-12", "2026-01", "2026-02"])).toEqual([
      { year: "2025", labels: ["2025-06", "2025-07", "2025-12"] },
      { year: "2026", labels: ["2026-01", "2026-02"] },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(groupByYear([])).toEqual([]);
  });

  it("handles a single year span", () => {
    expect(groupByYear(["2026-03", "2026-04"])).toEqual([
      { year: "2026", labels: ["2026-03", "2026-04"] },
    ]);
  });
});
