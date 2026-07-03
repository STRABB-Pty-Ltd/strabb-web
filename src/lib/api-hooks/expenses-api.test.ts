import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, postMock, patchMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ get: getMock, post: postMock, patch: patchMock, delete: deleteMock }),
  useAuthReady: () => true,
}));

import {
  useCreateExpense,
  useDeleteExpense,
  useExpenseBreakdown,
  useExpenses,
  useUpdateExpense,
} from "./expenses-api";

function newClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function providerFor(client: QueryClient): (props: { children: ReactNode }) => ReactNode {
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

const form = {
  name: "Office rent",
  category: "rent" as const,
  amount: 310,
  frequency: "monthly" as const,
  startDate: "2026-07-01",
};

describe("expenses-api queries", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset().mockResolvedValue(undefined);
    patchMock.mockReset().mockResolvedValue(undefined);
    deleteMock.mockReset().mockResolvedValue(undefined);
  });

  it("useExpenses GETs /expenses and unwraps { data }", async () => {
    getMock.mockResolvedValue({ data: [{ id: "e1", name: "Rent" }] });
    const { result } = renderHook(() => useExpenses(), { wrapper: providerFor(newClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/expenses");
    expect(result.current.data).toHaveLength(1);
  });

  it("useExpenseBreakdown passes the period params", async () => {
    getMock.mockResolvedValue({ data: [{ category: "cleaning", amount: 120 }] });
    const { result } = renderHook(() => useExpenseBreakdown("2026-07-01", "2026-07-31"), {
      wrapper: providerFor(newClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith(
      "/reporting/expense-breakdown?start_date=2026-07-01&end_date=2026-07-31",
    );
  });
});

describe("expenses-api mutations", () => {
  beforeEach(() => {
    postMock.mockReset().mockResolvedValue(undefined);
    patchMock.mockReset().mockResolvedValue(undefined);
    deleteMock.mockReset().mockResolvedValue(undefined);
  });

  it("useCreateExpense POSTs the definition and invalidates the derived KPI keys", async () => {
    const client = newClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useCreateExpense(), { wrapper: providerFor(client) });
    result.current.mutate(form);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(postMock).toHaveBeenCalledWith("/expenses", form);
    // The list plus every surface that reflects the expenses total must refresh.
    for (const key of [
      ["expenses"],
      ["expense-breakdown"],
      ["reporting-kpis"],
      ["reporting-charts"],
      ["dashboard-kpis"],
      ["dashboard-preview"],
    ]) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: key });
    }
  });

  it("useUpdateExpense PATCHes a partial (deactivate = isActive:false)", async () => {
    const { result } = renderHook(() => useUpdateExpense(), { wrapper: providerFor(newClient()) });
    result.current.mutate({ id: "e1", data: { isActive: false } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patchMock).toHaveBeenCalledWith("/expenses/e1", { isActive: false });
  });

  it("useDeleteExpense DELETEs by id", async () => {
    const { result } = renderHook(() => useDeleteExpense(), { wrapper: providerFor(newClient()) });
    result.current.mutate("e1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteMock).toHaveBeenCalledWith("/expenses/e1");
  });
});
