import { describe, expect, it } from "vitest";

import { EXPENSE_CHART_COLORS, expenseSliceColor } from "./expense-chart";

// D2.2 web sliver: Phase D can surface more than four expense categories, so the
// pie must colour more than four slices distinctly and cycle the palette rather
// than crash for any overflow.
describe("expense pie colours", () => {
  it("carries enough distinct colours for the Phase D category set (>4)", () => {
    expect(EXPENSE_CHART_COLORS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(EXPENSE_CHART_COLORS).size).toBe(EXPENSE_CHART_COLORS.length);
  });

  it("gives every slice up to the palette length a distinct colour", () => {
    const colours = Array.from({ length: EXPENSE_CHART_COLORS.length }, (_, i) =>
      expenseSliceColor(i),
    );
    expect(new Set(colours).size).toBe(EXPENSE_CHART_COLORS.length);
  });

  it("cycles (does not throw or return undefined) past the palette length", () => {
    const last = EXPENSE_CHART_COLORS.length - 1;
    expect(expenseSliceColor(EXPENSE_CHART_COLORS.length)).toBe(EXPENSE_CHART_COLORS[0]);
    expect(expenseSliceColor(EXPENSE_CHART_COLORS.length + last)).toBe(EXPENSE_CHART_COLORS[last]);
    expect(expenseSliceColor(100)).toBeTruthy();
  });
});
