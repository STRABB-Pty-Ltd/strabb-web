import { render, screen, waitFor } from "@testing-library/react";
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

import { TicketFormDialog } from "./ticket-form-dialog";

describe("TicketFormDialog auto-link", () => {
  beforeEach(() => {
    createTicketMutateAsync.mockReset();
    propertiesMock.mockReset();
    addToastMock.mockReset();
    propertiesMock.mockReturnValue({
      data: { data: [{ id: "11111111-1111-1111-1111-111111111111", name: "Beach House" }] },
    });
    createTicketMutateAsync.mockResolvedValue(undefined);
  });

  it("sends autoLinkToNext=true when the checkbox is ticked", async () => {
    render(<TicketFormDialog open onOpenChange={() => {}} />);

    const propertySelect = await screen.findByLabelText(/property/i);
    await userEvent.selectOptions(propertySelect, "11111111-1111-1111-1111-111111111111");
    await userEvent.type(screen.getByLabelText(/description/i), "Broken tap");
    await userEvent.click(
      screen.getByLabelText(/auto-link to next scheduled clean/i),
    );
    await userEvent.click(screen.getByRole("button", { name: /create ticket/i }));

    await waitFor(() => expect(createTicketMutateAsync).toHaveBeenCalled());
    expect(createTicketMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ autoLinkToNext: true, description: "Broken tap" }),
    );
  });

  it("sends autoLinkToNext=false when the checkbox is left unticked", async () => {
    render(<TicketFormDialog open onOpenChange={() => {}} />);

    const propertySelect = await screen.findByLabelText(/property/i);
    await userEvent.selectOptions(propertySelect, "11111111-1111-1111-1111-111111111111");
    await userEvent.type(screen.getByLabelText(/description/i), "Squeaky door");
    await userEvent.click(screen.getByRole("button", { name: /create ticket/i }));

    await waitFor(() => expect(createTicketMutateAsync).toHaveBeenCalled());
    expect(createTicketMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ autoLinkToNext: false }),
    );
  });
});
