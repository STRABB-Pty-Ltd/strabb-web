import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createTicketMutateAsync, propertiesMock, addToastMock } = vi.hoisted(() => ({
  createTicketMutateAsync: vi.fn(),
  propertiesMock: vi.fn(),
  addToastMock: vi.fn(),
}));

vi.mock("@/lib/api-hooks/tickets-api", () => ({
  useCreateTicketAPI: () => ({ mutateAsync: createTicketMutateAsync, isPending: false }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => propertiesMock(),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

import { TicketDrawer } from "./ticket-drawer";

describe("TicketDrawer", () => {
  beforeEach(() => {
    createTicketMutateAsync.mockReset();
    propertiesMock.mockReset();
    addToastMock.mockReset();
    propertiesMock.mockReturnValue({
      data: { data: [{ id: "11111111-1111-1111-1111-111111111111", name: "Beach House" }] },
    });
    createTicketMutateAsync.mockResolvedValue({
      ticket: { id: "tkt-new" },
      attemptedAutoLink: false,
      linkedCleanId: null,
    });
  });

  it("renders the ticket form when open", () => {
    render(<TicketDrawer open onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: /new ticket/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create ticket/i })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<TicketDrawer open={false} onClose={() => {}} />);
    expect(screen.queryByRole("heading", { name: /new ticket/i })).not.toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = vi.fn();
    render(<TicketDrawer open onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: /close ticket form/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on a mousedown outside the panel", () => {
    const onClose = vi.fn();
    render(<TicketDrawer open onClose={onClose} />);

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });
});
