import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Expense } from "@/lib/schemas/expense";

const expensesMock = vi.fn();
const breakdownMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const addToastMock = vi.fn();

vi.mock("@/lib/api-hooks/expenses-api", () => ({
  useExpenses: () => expensesMock(),
  useExpenseBreakdown: () => breakdownMock(),
  useCreateExpense: () => ({ mutate: createMock, isPending: false }),
  useUpdateExpense: () => ({ mutate: updateMock, isPending: false }),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { role: "owner" }, status: "authenticated" }),
}));

import { ExpensesSection } from "./expenses-section";

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    name: "Office rent",
    category: "rent",
    amount: 310,
    frequency: "monthly",
    propertyId: null,
    startDate: "2026-07-01",
    endDate: null,
    isActive: true,
    ...overrides,
  };
}

describe("ExpensesSection", () => {
  beforeEach(() => {
    expensesMock.mockReset().mockReturnValue({ data: [], isLoading: false });
    breakdownMock.mockReset().mockReturnValue({ data: [] });
    createMock.mockReset();
    updateMock.mockReset();
    addToastMock.mockReset();
  });

  it("shows the derived cleaning cost from the breakdown", () => {
    breakdownMock.mockReturnValue({ data: [{ category: "cleaning", amount: 456.78 }] });
    render(<ExpensesSection />);
    expect(screen.getByText("$456.78")).toBeInTheDocument();
  });

  it("renders $0.00 derived cost on an empty tenant", () => {
    render(<ExpensesSection />);
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("shows the empty state when no recurring expenses exist", () => {
    render(<ExpensesSection />);
    expect(screen.getByTestId("expenses-empty")).toBeInTheDocument();
  });

  it("lists a recurring expense with its amount", () => {
    expensesMock.mockReturnValue({ data: [expense({ name: "Netflix" })], isLoading: false });
    render(<ExpensesSection />);
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText("$310.00")).toBeInTheDocument();
  });

  it("rejects a zero amount without calling create", async () => {
    render(<ExpensesSection />);
    await userEvent.click(screen.getByRole("button", { name: /add expense/i }));
    await userEvent.type(screen.getByLabelText(/name/i), "Bad expense");
    await userEvent.type(screen.getByLabelText(/amount/i), "0");
    await userEvent.click(screen.getByRole("button", { name: /add expense/i }));
    expect(createMock).not.toHaveBeenCalled();
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        message: expect.stringMatching(/greater than zero/i),
      }),
    );
  });

  it("creates a valid expense with the parsed payload", async () => {
    render(<ExpensesSection />);
    await userEvent.click(screen.getByRole("button", { name: /add expense/i }));
    await userEvent.type(screen.getByLabelText(/name/i), "Insurance");
    await userEvent.selectOptions(screen.getByLabelText(/category/i), "insurance");
    await userEvent.type(screen.getByLabelText(/amount/i), "125.5");
    await userEvent.click(screen.getByRole("button", { name: /add expense/i }));

    expect(createMock).toHaveBeenCalledTimes(1);
    const payload = createMock.mock.calls[0][0];
    expect(payload).toMatchObject({ name: "Insurance", category: "insurance", amount: 125.5 });
  });

  it("deactivates an active expense via an isActive:false update", async () => {
    expensesMock.mockReturnValue({ data: [expense({ isActive: true })], isLoading: false });
    render(<ExpensesSection />);
    await userEvent.click(screen.getByRole("button", { name: /deactivate/i }));
    expect(updateMock).toHaveBeenCalledWith(
      { id: "e1", data: { isActive: false } },
      expect.any(Object),
    );
  });
});
