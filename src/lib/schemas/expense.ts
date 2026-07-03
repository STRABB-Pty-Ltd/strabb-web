import { z } from "zod";

/**
 * Recurring-expense types (Phase D2). Expenses are an OWNER|ADMIN surface; the
 * api gates every /expenses endpoint with require_role(OWNER, ADMIN). All shapes
 * here are camelCase (post keysToCamel). A recurring definition feeds the KPI
 * "expenses" total and the reporting category breakdown via a shared server-side
 * amortisation; at launch there is deliberately no per-listing allocation, so an
 * expense is tenant-level (propertyId null) unless explicitly scoped.
 */

export const EXPENSE_CATEGORIES = [
  "rent",
  "utilities",
  "insurance",
  "subscriptions",
  "supplies",
  "maintenance",
  "wages_other",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: "Rent",
  utilities: "Utilities",
  insurance: "Insurance",
  subscriptions: "Subscriptions",
  supplies: "Supplies",
  maintenance: "Maintenance",
  wages_other: "Wages (other)",
  other: "Other",
};

export const EXPENSE_FREQUENCIES = [
  "one_off",
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
  "yearly",
] as const;

export type ExpenseFrequency = (typeof EXPENSE_FREQUENCIES)[number];

export const EXPENSE_FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  one_off: "One-off",
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export interface Expense {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  frequency: ExpenseFrequency;
  propertyId: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
}

// A row from /reporting/expense-breakdown: one per category present in the
// window, with itemCount = active definitions in that category. The derived
// cleaning-cost card reads the "cleaning" row; the pie consumes { category,
// amount }.
export interface ExpenseBreakdownRow {
  category: string;
  amount: number;
  itemCount?: number;
  currency?: string;
}

// Create/edit form. `amount` is coerced from the text input and must be strictly
// positive (zero/negative rejected client-side; the api 422s them too). The
// category/frequency enums mirror the api validation sets verbatim, so an
// unknown value is rejected before it can be sent.
export const expenseFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero"),
  frequency: z.enum(EXPENSE_FREQUENCIES),
  propertyId: z.string().nullable().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseFormSchema>;
