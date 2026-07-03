import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CleaningTaskResponse } from "@/lib/schemas/cleaning-task";

const {
  addToastMock,
  closeDrillDownPanelMock,
  taskMock,
  completeMock,
  resendMock,
  updateMock,
  linkTicketMutate,
  unlinkTicketMutate,
  linkedTicketMock,
  ticketsAPIMock,
  updateTicketMutate,
} = vi.hoisted(() => ({
  addToastMock: vi.fn(),
  closeDrillDownPanelMock: vi.fn(),
  taskMock: vi.fn(),
  completeMock: vi.fn(),
  resendMock: vi.fn(),
  updateMock: vi.fn(),
  linkTicketMutate: vi.fn(),
  unlinkTicketMutate: vi.fn(),
  linkedTicketMock: vi.fn(),
  ticketsAPIMock: vi.fn(),
  updateTicketMutate: vi.fn(),
}));

const storeState = {
  drillDownPanel: null as { open: boolean; type: string; itemId: string } | null,
  closeDrillDownPanel: closeDrillDownPanelMock,
  addToast: addToastMock,
};

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

vi.mock("@/hooks/use-cleaning-tasks", () => ({
  useCleaningTask: () => taskMock(),
  useCompleteCleaningTask: () => ({ mutate: completeMock, isPending: false }),
  useResendNotification: () => ({ mutate: resendMock, isPending: false }),
  useUpdateCleaningTask: () => ({ mutate: updateMock, isPending: false }),
}));

vi.mock("@/lib/api-hooks/cleaning-api", () => ({
  useLinkTicketToClean: () => ({ mutate: linkTicketMutate, isPending: false }),
  useUnlinkTicketFromClean: () => ({ mutate: unlinkTicketMutate, isPending: false }),
}));

vi.mock("@/lib/api-hooks/tickets-api", () => ({
  useTicket: () => linkedTicketMock(),
  useTicketsAPI: () => ticketsAPIMock(),
  useUpdateTicketAPI: () => ({ mutate: updateTicketMutate, isPending: false }),
}));

vi.mock("@/hooks/use-property-timezone", () => ({
  usePropertyTimezone: () => "Australia/Sydney",
}));

vi.mock("@/hooks/use-listings", () => ({
  useListings: () => ({
    data: { data: [{ id: "listing-1", name: "Beach House Listing" }] },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => ({
    data: { data: [{ id: "prop-1", name: "Beach House" }] },
    isLoading: false,
  }),
}));

// The embedded cleaner picker fetches the cleaner roster; stub it so the drawer
// test does not depend on a session/query provider for that child hook.
vi.mock("@/hooks/use-team", () => ({
  useTeamMembers: () => ({ data: { data: [] }, isLoading: false }),
}));

import { CleaningDetailDrawer } from "./cleaning-detail-drawer";

const baseTask: CleaningTaskResponse = {
  id: "task-1",
  bookingId: "book-1",
  propertyId: "prop-1",
  listingId: "listing-1",
  cleanerName: "Jane Cleaner",
  cleanerEmail: "jane@example.com",
  cleanerPhone: "+61400111222",
  assignedUserId: null,
  scheduledDate: "2026-04-26T09:00:00Z",
  status: "pending",
  notes: "Bring eco supplies",
  linkedTicketId: null,
  createdAt: "2026-04-20T00:00:00Z",
  updatedAt: "2026-04-20T00:00:00Z",
};

describe("CleaningDetailDrawer", () => {
  beforeEach(() => {
    addToastMock.mockReset();
    closeDrillDownPanelMock.mockReset();
    completeMock.mockReset();
    resendMock.mockReset();
    updateMock.mockReset();
    taskMock.mockReset();
    linkTicketMutate.mockReset();
    unlinkTicketMutate.mockReset();
    linkedTicketMock.mockReset();
    ticketsAPIMock.mockReset();
    updateTicketMutate.mockReset();

    linkedTicketMock.mockReturnValue({ data: null, isLoading: false });
    ticketsAPIMock.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 } },
      isLoading: false,
    });
    storeState.drillDownPanel = null;
  });

  it("renders nothing when drill-down is not a cleaning task", () => {
    storeState.drillDownPanel = { open: true, type: "revenue", itemId: "foo" };
    taskMock.mockReturnValue({ data: null, isLoading: false });
    const { container } = render(<CleaningDetailDrawer />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders task details when cleaning drill-down is open", () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({ data: baseTask, isLoading: false });
    render(<CleaningDetailDrawer />);

    expect(screen.getByText("Jane Cleaner")).toBeInTheDocument();
    expect(screen.getByText(baseTask.cleanerEmail!)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark complete/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /resend notification/i })).toBeEnabled();
  });

  it("disables Mark complete for completed tasks", () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({
      data: { ...baseTask, status: "completed" },
      isLoading: false,
    });
    render(<CleaningDetailDrawer />);

    expect(screen.getByRole("button", { name: /mark complete/i })).toBeDisabled();
  });

  it("disables Resend when cleaner has no email", () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({
      data: { ...baseTask, cleanerEmail: null },
      isLoading: false,
    });
    render(<CleaningDetailDrawer />);

    expect(screen.getByRole("button", { name: /resend notification/i })).toBeDisabled();
  });

  it("calls complete mutation when Mark complete clicked", async () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({ data: baseTask, isLoading: false });
    render(<CleaningDetailDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /mark complete/i }));
    expect(completeMock).toHaveBeenCalledWith(baseTask.id, expect.any(Object));
  });

  it("saves notes via update mutation when Edit + Save notes clicked", async () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({ data: baseTask, isLoading: false });
    render(<CleaningDetailDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    await userEvent.click(screen.getByRole("button", { name: /save notes/i }));

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: baseTask.id,
        data: expect.objectContaining({ notes: "Bring eco supplies" }),
      }),
      expect.any(Object),
    );
  });

  it("opens the cleaner picker dialog when Change clicked", async () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({ data: baseTask, isLoading: false });
    render(<CleaningDetailDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /change/i }));

    expect(screen.getByRole("dialog", { name: /assign cleaner/i })).toBeInTheDocument();
    expect(screen.getByText(/assign cleaner/i)).toBeInTheDocument();
  });

  it("Link to ticket button calls link mutation with picked ticket id", async () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({ data: baseTask, isLoading: false });
    ticketsAPIMock.mockReturnValue({
      data: {
        data: [
          {
            id: "tkt-9",
            propertyId: "prop-1",
            listingId: "listing-1",
            description: "Broken shower",
            priority: "high",
            status: "pending",
            dateReported: "2026-04-25T00:00:00Z",
            dateScheduled: null,
            dateCompleted: null,
            cost: null,
            notes: null,
            createdAt: "2026-04-25T00:00:00Z",
            updatedAt: "2026-04-25T00:00:00Z",
          },
        ],
        meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
      },
      isLoading: false,
    });
    render(<CleaningDetailDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /link to ticket/i }));
    await userEvent.selectOptions(screen.getByRole("combobox"), "tkt-9");
    await userEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(linkTicketMutate).toHaveBeenCalledWith(
      { cleanId: baseTask.id, ticketId: "tkt-9" },
      expect.any(Object),
    );
  });

  it("Unlink button calls unlink mutation with the clean id", async () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({
      data: { ...baseTask, linkedTicketId: "tkt-7" },
      isLoading: false,
    });
    linkedTicketMock.mockReturnValue({
      data: {
        id: "tkt-7",
        propertyId: "prop-1",
        listingId: "listing-1",
        description: "Linked ticket",
        priority: "high",
        status: "pending",
        dateReported: "2026-04-25T00:00:00Z",
        dateScheduled: null,
        dateCompleted: null,
        cost: null,
        notes: null,
        createdAt: "2026-04-25T00:00:00Z",
        updatedAt: "2026-04-25T00:00:00Z",
      },
      isLoading: false,
    });
    render(<CleaningDetailDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /^unlink$/i }));
    expect(unlinkTicketMutate).toHaveBeenCalledWith(baseTask.id, expect.any(Object));
  });

  it("Close-prompt fires when completing a clean with an open linked ticket", async () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({
      data: { ...baseTask, linkedTicketId: "tkt-7" },
      isLoading: false,
    });
    linkedTicketMock.mockReturnValue({
      data: {
        id: "tkt-7",
        propertyId: "prop-1",
        listingId: "listing-1",
        description: "Linked ticket",
        priority: "high",
        status: "pending",
        dateReported: "2026-04-25T00:00:00Z",
        dateScheduled: null,
        dateCompleted: null,
        cost: null,
        notes: null,
        createdAt: "2026-04-25T00:00:00Z",
        updatedAt: "2026-04-25T00:00:00Z",
      },
      isLoading: false,
    });
    completeMock.mockImplementation((_id, opts) => opts?.onSuccess?.());
    render(<CleaningDetailDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /mark complete/i }));

    await waitFor(() =>
      expect(screen.getByText(/mark linked ticket complete too/i)).toBeInTheDocument(),
    );
  });

  it("Declining the close-prompt does NOT fire the linked-ticket update", async () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({
      data: { ...baseTask, linkedTicketId: "tkt-7" },
      isLoading: false,
    });
    linkedTicketMock.mockReturnValue({
      data: {
        id: "tkt-7",
        propertyId: "prop-1",
        listingId: "listing-1",
        description: "Linked ticket",
        priority: "high",
        status: "pending",
        dateReported: "2026-04-25T00:00:00Z",
        dateScheduled: null,
        dateCompleted: null,
        cost: null,
        notes: null,
        createdAt: "2026-04-25T00:00:00Z",
        updatedAt: "2026-04-25T00:00:00Z",
      },
      isLoading: false,
    });
    completeMock.mockImplementation((_id, opts) => opts?.onSuccess?.());
    render(<CleaningDetailDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /mark complete/i }));
    await waitFor(() => screen.getByText(/mark linked ticket complete too/i));
    await userEvent.click(screen.getByRole("button", { name: /leave it open/i }));

    expect(updateTicketMutate).not.toHaveBeenCalled();
  });
});
