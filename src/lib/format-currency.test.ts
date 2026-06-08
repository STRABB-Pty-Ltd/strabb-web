import { describe, expect, it } from "vitest";

import { formatCurrency } from "./format-currency";

describe("formatCurrency", () => {
  it("defaults to AUD with the en-AU locale", () => {
    expect(formatCurrency(123.45)).toBe("$123.45");
  });

  it("respects an explicit currency override", () => {
    const result = formatCurrency(99.99, "USD");
    expect(result).toContain("99.99");
    expect(result).toContain("US");
  });

  it("formats large numbers with thousands separators", () => {
    expect(formatCurrency(1234567.89)).toBe("$1,234,567.89");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative numbers with a minus sign", () => {
    expect(formatCurrency(-50.5)).toBe("-$50.50");
  });

  it("always renders cents, including a half-dollar value", () => {
    // The reconciliation bug: 96.50 displayed as a whole dollar broke
    // revenue - expenses = net income on the KPI row.
    expect(formatCurrency(96.5)).toBe("$96.50");
  });

  it("keeps cents on whole-dollar amounts so figures reconcile", () => {
    // 643.00 - 96.50 should visibly equal 546.50.
    expect(formatCurrency(643)).toBe("$643.00");
    expect(formatCurrency(546.5)).toBe("$546.50");
  });
});
