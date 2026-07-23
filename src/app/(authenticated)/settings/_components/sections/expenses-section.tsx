"use client";

import { format, startOfMonth } from "date-fns";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useCreateExpense,
  useExpenseBreakdown,
  useExpenses,
  useUpdateExpense,
} from "@/lib/api-hooks/expenses-api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ApiError } from "@/lib/api-client";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_FREQUENCIES,
  EXPENSE_FREQUENCY_LABELS,
  expenseFormSchema,
  type Expense,
  type ExpenseCategory,
  type ExpenseFrequency,
} from "@/lib/schemas/expense";
import { useAppStore } from "@/stores/app-store";

const formatAUD = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);

interface FormState {
  name: string;
  category: ExpenseCategory;
  amount: string;
  frequency: ExpenseFrequency;
  startDate: string;
}

function emptyForm(): FormState {
  return {
    name: "",
    category: "other",
    amount: "",
    frequency: "monthly",
    startDate: format(new Date(), "yyyy-MM-dd"),
  };
}

export function ExpensesSection() {
  const { role } = useCurrentUser();
  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const addToast = useAppStore((s) => s.addToast);

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: breakdown } = useExpenseBreakdown(monthStart, today);
  const cleaningCost = breakdown?.find((r) => r.category === "cleaning")?.amount ?? 0;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  // Defence in depth: expenses are an owner/admin surface. Middleware + nav
  // hiding already block cleaners from settings and the API 403s /expenses, but
  // guard here too so the controls never render for a non-owner role.
  if (role !== null && role !== "owner" && role !== "admin") {
    return null;
  }

  const handleError = (err: unknown) => {
    const message =
      err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Something went wrong";
    addToast({ type: "error", message });
  };

  const openNew = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (expense: Expense) => {
    setForm({
      name: expense.name,
      category: expense.category,
      amount: String(expense.amount),
      frequency: expense.frequency,
      startDate: expense.startDate,
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    const parsed = expenseFormSchema.safeParse(form);
    if (!parsed.success) {
      addToast({ type: "error", message: parsed.error.issues[0]?.message ?? "Invalid expense" });
      return;
    }
    const onDone = (verb: string) => {
      addToast({ type: "success", message: `Expense ${verb}` });
      closeForm();
    };
    if (editingId) {
      updateExpense.mutate(
        { id: editingId, data: parsed.data },
        { onSuccess: () => onDone("updated"), onError: handleError },
      );
    } else {
      createExpense.mutate(parsed.data, { onSuccess: () => onDone("added"), onError: handleError });
    }
  };

  const toggleActive = (expense: Expense) => {
    updateExpense.mutate(
      { id: expense.id, data: { isActive: !expense.isActive } },
      {
        onSuccess: () =>
          addToast({
            type: "success",
            message: expense.isActive ? "Expense deactivated" : "Expense reactivated",
          }),
        onError: handleError,
      },
    );
  };

  const rows = expenses ?? [];
  const saving = createExpense.isPending || updateExpense.isPending;

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading text-highlight-10 font-semibold">Expenses</h2>
        <p className="text-body text-highlight-10">
          Track recurring costs. These feed your expense KPIs and the category breakdown.
        </p>
      </div>

      <div className="p-sm space-y-xs rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <p className="text-body text-highlight-10 font-medium">
          Derived cleaning cost (this month)
        </p>
        <p className="font-data text-subheading text-highlight-10 font-semibold">
          {formatAUD(cleaningCost)}
        </p>
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          Calculated as hours worked times each cleaner&apos;s rate at completion. A manual cost on
          a task overrides it, and changing a rate does not re-price already-completed cleans.
          Recurring expenses show in KPIs and the category breakdown, not in per-listing figures.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-body text-highlight-10 font-semibold">Recurring expenses</h3>
        {!showForm && (
          <Button type="button" onClick={openNew}>
            Add expense
          </Button>
        )}
      </div>

      {showForm && (
        <div className="p-sm space-y-sm rounded-lg border" style={{ borderColor: "var(--border)" }}>
          <label className="space-y-xs block">
            <span className="text-body text-highlight-10 font-medium">Name</span>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <div className="gap-sm grid grid-cols-1 md:grid-cols-2">
            <label className="space-y-xs block">
              <span className="text-body text-highlight-10 font-medium">Category</span>
              <Select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))
                }
                options={EXPENSE_CATEGORIES.map((c) => ({
                  value: c,
                  label: EXPENSE_CATEGORY_LABELS[c],
                }))}
              />
            </label>
            <label className="space-y-xs block">
              <span className="text-body text-highlight-10 font-medium">Frequency</span>
              <Select
                value={form.frequency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, frequency: e.target.value as ExpenseFrequency }))
                }
                options={EXPENSE_FREQUENCIES.map((fr) => ({
                  value: fr,
                  label: EXPENSE_FREQUENCY_LABELS[fr],
                }))}
              />
            </label>
            <label className="space-y-xs block">
              <span className="text-body text-highlight-10 font-medium">Amount (AUD)</span>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </label>
            <label className="space-y-xs block">
              <span className="text-body text-highlight-10 font-medium">Start date</span>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </label>
          </div>
          <div className="gap-xs flex">
            <Button type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add expense"}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="text-body text-highlight-10"
        >
          Loading...
        </p>
      ) : rows.length === 0 ? (
        <div
          data-testid="expenses-empty"
          className="p-md rounded-lg text-center"
          style={{ backgroundColor: "var(--neutral-30)" }}
        >
          <p className="text-body text-highlight-10">
            No recurring expenses yet. Add rent, utilities, subscriptions and the like to see them
            in your KPIs.
          </p>
        </div>
      ) : (
        <div className="gap-xs flex flex-col">
          {rows.map((expense) => (
            <div
              key={expense.id}
              className="p-sm gap-sm flex items-center rounded-lg border"
              style={{ borderColor: "var(--border)", opacity: expense.isActive ? 1 : 0.55 }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-body text-highlight-10 truncate font-medium">{expense.name}</p>
                <p className="text-body" style={{ color: "var(--text-secondary)" }}>
                  {EXPENSE_CATEGORY_LABELS[expense.category]} -{" "}
                  {EXPENSE_FREQUENCY_LABELS[expense.frequency]} -{" "}
                  {expense.propertyId ? "Specific listing" : "All listings"}
                  {!expense.isActive && " - Inactive"}
                </p>
              </div>
              <span className="font-data text-body text-highlight-10 font-semibold">
                {formatAUD(expense.amount)}
              </span>
              <Button type="button" variant="outline" size="xs" onClick={() => openEdit(expense)}>
                Edit
              </Button>
              <button
                type="button"
                onClick={() => toggleActive(expense)}
                disabled={updateExpense.isPending}
                className="px-sm py-xs text-body rounded-md font-medium disabled:opacity-60"
                style={{
                  color: expense.isActive ? "var(--status-danger)" : "var(--status-success)",
                  border: `var(--hairline) solid var(--border)`,
                }}
              >
                {expense.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
