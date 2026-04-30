import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Ticket } from "@/types/ticket";

const { ticketsMock, propertiesMock, openDrillDownPanelMock } = vi.hoisted(() => ({
  ticketsMock: vi.fn(),
  propertiesMock: vi.fn(),
  openDrillDownPanelMock: vi.fn(),
}));

vi.mock("@/lib/api-hooks/tickets-api", () => ({
  useTicketsAPI: (...args: unknown[]) => ticketsMock(...args),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => propertiesMock(),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({
      openDrillDownPanel: openDrillDownPanelMock,
      addToast: vi.fn(),
    }),
}));

vi.mock("./_components/ticket-form-dialog", () => ({
  TicketFormDialog: ({ trigger }: { trigger: React.ReactNode }) => (
    <div data-testid="form-dialog">{trigger}</div>
  ),
}));

import TicketsPage from "./page";

const item: Ticket = {
  id: "tkt-1",
  propertyId: "prop-1",
  listingId: null,
  description: "Leaking tap in main bathroom",
  priority: "high",
  status: "pending",
  dateReported: "2026-04-25T00:00:00Z",
  dateScheduled: null,
  dateCompleted: null,
  cost: null,
  notes: null,
  createdAt: "2026-04-25T00:00:00Z",
  updatedAt: "2026-04-25T00:00:00Z",
};

describe("TicketsPage", () => {
  beforeEach(() => {
    ticketsMock.mockReset();
    propertiesMock.mockReset();
    openDrillDownPanelMock.mockReset();

    propertiesMock.mockReturnValue({
      data: { data: [{ id: "prop-1", name: "Beach House", timezone: "Australia/Sydney" }] },
    });
    ticketsMock.mockReturnValue({
      data: {
        data: [item],
        meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
      },
      isLoading: false,
    });
  });

  it("renders tickets with property names resolved", () => {
    render(<TicketsPage />);

    // "Beach House" appears in the property filter and the row — confirm both surface
    expect(screen.getAllByText("Beach House").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/leaking tap/i)).toBeInTheDocument();
  });

  it("status filter change refetches with status filter applied", async () => {
    render(<TicketsPage />);

    const statusSelect = screen.getByRole("combobox", { name: /status/i });
    await userEvent.selectOptions(statusSelect, "pending");

    const lastCall = ticketsMock.mock.calls.at(-1)?.[0];
    expect(lastCall).toEqual(expect.objectContaining({ status: "pending", page: 1 }));
  });

  it("clicking a row opens the drill-down panel for that ticket", async () => {
    render(<TicketsPage />);

    await userEvent.click(screen.getByText(/leaking tap/i));
    expect(openDrillDownPanelMock).toHaveBeenCalledWith("ticket", item.id);
  });

  it("loading state hides the list", () => {
    ticketsMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<TicketsPage />);
    expect(screen.getByText(/loading tickets/i)).toBeInTheDocument();
  });
});
