import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Ticket } from "@/types/ticket";

const {
  addToastMock,
  closeDrillDownPanelMock,
  ticketMock,
  propertiesMock,
  updateMutate,
  deleteMutate,
} = vi.hoisted(() => ({
  addToastMock: vi.fn(),
  closeDrillDownPanelMock: vi.fn(),
  ticketMock: vi.fn(),
  propertiesMock: vi.fn(),
  updateMutate: vi.fn(),
  deleteMutate: vi.fn(),
}));

const storeState = {
  drillDownPanel: null as { open: boolean; type: string; itemId: string } | null,
  closeDrillDownPanel: closeDrillDownPanelMock,
  addToast: addToastMock,
};

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

vi.mock("@/lib/api-hooks/tickets-api", () => ({
  useTicket: () => ticketMock(),
  useUpdateTicketAPI: () => ({ mutate: updateMutate, isPending: false }),
  useDeleteTicketAPI: () => ({ mutate: deleteMutate, isPending: false }),
  useLinkCleanToTicket: () => ({ mutate: vi.fn(), isPending: false }),
  useUnlinkCleanFromTicket: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/api-hooks/cleaning-api", () => ({
  useCleaningTasksAPI: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/hooks/use-cleaning-tasks", () => ({
  useCompleteCleaningTask: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => propertiesMock(),
}));

vi.mock("@/hooks/use-listings", () => ({
  useListings: () => ({
    data: { data: [{ id: "listing-1", name: "Beach House Listing" }] },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-property-timezone", () => ({
  usePropertyTimezone: () => "Australia/Sydney",
}));

import { TicketDetailDrawer } from "./ticket-detail-drawer";

const baseTicket: Ticket = {
  id: "tkt-1",
  propertyId: "prop-1",
  listingId: null,
  description: "Leaking tap",
  priority: "high",
  status: "pending",
  dateReported: "2026-04-25T00:00:00Z",
  dateScheduled: null,
  dateCompleted: null,
  cost: null,
  notes: null,
  linkedCleanId: null,
  createdAt: "2026-04-25T00:00:00Z",
  updatedAt: "2026-04-25T00:00:00Z",
};

describe("TicketDetailDrawer", () => {
  beforeEach(() => {
    addToastMock.mockReset();
    closeDrillDownPanelMock.mockReset();
    ticketMock.mockReset();
    propertiesMock.mockReset();
    updateMutate.mockReset();
    deleteMutate.mockReset();

    propertiesMock.mockReturnValue({
      data: { data: [{ id: "prop-1", name: "Beach House" }] },
    });
    storeState.drillDownPanel = null;
  });

  it("renders nothing when drill-down is not ticket", () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: "x" };
    ticketMock.mockReturnValue({ data: null, isLoading: false });
    const { container } = render(<TicketDetailDrawer />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders ticket detail with property name resolved", () => {
    storeState.drillDownPanel = { open: true, type: "ticket", itemId: baseTicket.id };
    ticketMock.mockReturnValue({ data: baseTicket, isLoading: false });
    render(<TicketDetailDrawer />);

    expect(screen.getByText("Beach House")).toBeInTheDocument();
    expect(screen.getByText("Leaking tap")).toBeInTheDocument();
  });

  it("editing a field via its edit chip and Save fires update mutation", async () => {
    storeState.drillDownPanel = { open: true, type: "ticket", itemId: baseTicket.id };
    ticketMock.mockReturnValue({ data: baseTicket, isLoading: false });
    render(<TicketDetailDrawer />);

    // Each of the 4 fields now has its own "edit" chip; clicking one reveals Save.
    await userEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[0]);
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(updateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: baseTicket.id,
        data: expect.objectContaining({ description: "Leaking tap", priority: "high" }),
      }),
      expect.any(Object),
    );
  });

  it("Delete requires confirmation then calls delete mutation", async () => {
    storeState.drillDownPanel = { open: true, type: "ticket", itemId: baseTicket.id };
    ticketMock.mockReturnValue({ data: baseTicket, isLoading: false });
    render(<TicketDetailDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(deleteMutate).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /yes, delete/i }));
    expect(deleteMutate).toHaveBeenCalledWith(baseTicket.id, expect.any(Object));
  });
});
