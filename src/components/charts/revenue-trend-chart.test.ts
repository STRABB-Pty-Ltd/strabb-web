import { describe, expect, it } from "vitest";

import { formatMonthLabel } from "./revenue-trend-chart";

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
