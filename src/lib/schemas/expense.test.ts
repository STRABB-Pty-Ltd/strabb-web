import { describe, expect, it } from "vitest";

import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_FREQUENCIES,
  EXPENSE_FREQUENCY_LABELS,
  expenseFormSchema,
} from "./expense";

const base = {
  name: "Office rent",
  category: "rent",
  amount: 310,
  frequency: "monthly",
  startDate: "2026-07-01",
};

describe("expenseFormSchema", () => {
  it("accepts a valid definition", () => {
    expect(expenseFormSchema.safeParse(base).success).toBe(true);
  });

  it("coerces a numeric string amount", () => {
    const parsed = expenseFormSchema.safeParse({ ...base, amount: "310.50" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.amount).toBe(310.5);
  });

  it("rejects a zero amount", () => {
    expect(expenseFormSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(expenseFormSchema.safeParse({ ...base, amount: -50 }).success).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(expenseFormSchema.safeParse({ ...base, category: "yacht" }).success).toBe(false);
  });

  it("rejects an unknown frequency", () => {
    expect(expenseFormSchema.safeParse({ ...base, frequency: "hourly" }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(expenseFormSchema.safeParse({ ...base, name: "" }).success).toBe(false);
  });
});

describe("expense label maps", () => {
  it("labels every category", () => {
    for (const c of EXPENSE_CATEGORIES) expect(EXPENSE_CATEGORY_LABELS[c]).toBeTruthy();
  });
  it("labels every frequency", () => {
    for (const f of EXPENSE_FREQUENCIES) expect(EXPENSE_FREQUENCY_LABELS[f]).toBeTruthy();
  });
});
