"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import type { Expense, ExpenseBreakdownRow, ExpenseFormData } from "@/lib/schemas/expense";

/**
 * Recurring-expense data hooks (Phase D2). CRUD on the OWNER|ADMIN /expenses
 * endpoints plus a read of /reporting/expense-breakdown for the derived
 * cleaning-cost card. Mutations invalidate both the expenses list and every
 * surface that reflects the KPI "expenses" total (reporting + dashboard), so a
 * new or deactivated definition flows through to the numbers on next fetch.
 */

export const EXPENSES_KEY = ["expenses"] as const;

// Keys that consume the server-side expenses total and must refresh when a
// definition changes. Kept as a list so create/update/delete stay in sync.
const DERIVED_KEYS = [
  ["expenses"],
  ["expense-breakdown"],
  ["reporting-kpis"],
  ["reporting-charts"],
  ["dashboard-kpis"],
  ["dashboard-preview"],
] as const;

function invalidateDerived(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of DERIVED_KEYS) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

export function useExpenses() {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<Expense[]>({
    queryKey: EXPENSES_KEY,
    queryFn: async () => {
      const res = await apiClient.get<{ data: Expense[] }>("/expenses");
      return res.data;
    },
    enabled: isReady,
  });
}

// Derived cleaning-cost card + any settings-side breakdown read. Scoped to a
// period so it lines up with the reporting figures for the same window.
export function useExpenseBreakdown(startDate: string, endDate: string) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });

  return useQuery<ExpenseBreakdownRow[]>({
    queryKey: ["expense-breakdown", startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ExpenseBreakdownRow[] }>(
        `/reporting/expense-breakdown?${params.toString()}`,
      );
      return res.data;
    },
    enabled: isReady,
  });
}

export function useCreateExpense() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExpenseFormData) => apiClient.post("/expenses", data),
    onSuccess: () => invalidateDerived(queryClient),
  });
}

export function useUpdateExpense() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    // Partial update: edits and the deactivate toggle (isActive:false) both go
    // through here, so no data is lost by preferring soft-deactivate over delete.
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseFormData> }) =>
      apiClient.patch(`/expenses/${id}`, data),
    onSuccess: () => invalidateDerived(queryClient),
  });
}

export function useDeleteExpense() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/expenses/${id}`),
    onSuccess: () => invalidateDerived(queryClient),
  });
}
