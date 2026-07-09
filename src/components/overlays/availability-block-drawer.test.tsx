import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AvailabilityBlockResponse } from "@/lib/schemas/availability-block";

const {
  addToastMock,
  closeAvailabilityBlockDrawerMock,
  propertiesMock,
  blocksMock,
  createMutateAsyncMock,
  updateMutateAsyncMock,
  deleteMutateAsyncMock,
} = vi.hoisted(() => ({
  addToastMock: vi.fn(),
  closeAvailabilityBlockDrawerMock: vi.fn(),
  propertiesMock: vi.fn(),
  blocksMock: vi.fn(),
  createMutateAsyncMock: vi.fn(),
  updateMutateAsyncMock: vi.fn(),
  deleteMutateAsyncMock: vi.fn(),
}));

const storeState: {
  availabilityBlockDrawer: { open: boolean; blockId: string | null } | null;
  closeAvailabilityBlockDrawer: typeof closeAvailabilityBlockDrawerMock;
  addToast: typeof addToastMock;
} = {
  availabilityBlockDrawer: null,
  closeAvailabilityBlockDrawer: closeAvailabilityBlockDrawerMock,
  addToast: addToastMock,
};

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => propertiesMock(),
}));

vi.mock("@/lib/api-hooks/availability-blocks-api", () => ({
  useAvailabilityBlocks: () => blocksMock(),
  useCreateAvailabilityBlock: () => ({ mutateAsync: createMutateAsyncMock, isPending: false }),
  useUpdateAvailabilityBlock: () => ({ mutateAsync: updateMutateAsyncMock, isPending: false }),
  useDeleteAvailabilityBlock: () => ({ mutateAsync: deleteMutateAsyncMock, isPending: false }),
}));

import { AvailabilityBlockDrawer } from "./availability-block-drawer";

function makeBlock(overrides: Partial<AvailabilityBlockResponse> = {}): AvailabilityBlockResponse {
  return {
    id: "block-1",
    propertyId: "prop-1",
    startDate: "2026-08-10T00:00:00Z",
    endDate: "2026-08-13T00:00:00Z",
    reason: "owner_block",
    notes: "Owner staying",
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("AvailabilityBlockDrawer", () => {
  beforeEach(() => {
    addToastMock.mockReset();
    closeAvailabilityBlockDrawerMock.mockReset();
    propertiesMock.mockReset();
    blocksMock.mockReset();
    createMutateAsyncMock.mockReset();
    updateMutateAsyncMock.mockReset();
    deleteMutateAsyncMock.mockReset();

    propertiesMock.mockReturnValue({
      data: {
        data: [
          { id: "prop-1", name: "Beach House" },
          { id: "prop-2", name: "City Loft" },
        ],
      },
      isLoading: false,
    });
    blocksMock.mockReturnValue({ data: [], isLoading: false });
    storeState.availabilityBlockDrawer = null;
  });

  it("create mode renders the property/date/reason fields and blocks save without a property", async () => {
    storeState.availabilityBlockDrawer = { open: true, blockId: null };
    render(<AvailabilityBlockDrawer />);

    expect(screen.getByLabelText("Property")).toBeInTheDocument();
    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
    expect(screen.getByLabelText("Reason")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Owner stay" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Maintenance" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Other" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /block dates/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Choose a property");
    expect(createMutateAsyncMock).not.toHaveBeenCalled();
  });

  it("valid create calls create.mutateAsync with the chosen property, dates and reason", async () => {
    storeState.availabilityBlockDrawer = { open: true, blockId: null };
    render(<AvailabilityBlockDrawer />);

    await userEvent.selectOptions(screen.getByLabelText("Property"), "prop-1");
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-10" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-08-13" } });
    await userEvent.selectOptions(screen.getByLabelText("Reason"), "maintenance");

    await userEvent.click(screen.getByRole("button", { name: /block dates/i }));

    expect(createMutateAsyncMock).toHaveBeenCalledWith({
      propertyId: "prop-1",
      startDate: "2026-08-10",
      endDate: "2026-08-13",
      reason: "maintenance",
      notes: null,
    });
  });

  it("end date on or before the start date shows a validation error and does not mutate", async () => {
    storeState.availabilityBlockDrawer = { open: true, blockId: null };
    render(<AvailabilityBlockDrawer />);

    await userEvent.selectOptions(screen.getByLabelText("Property"), "prop-1");
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-10" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-08-10" } });

    await userEvent.click(screen.getByRole("button", { name: /block dates/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("End date must be after the start date");
    expect(createMutateAsyncMock).not.toHaveBeenCalled();
  });

  it("edit mode prefills the form, disables the property select, and removes the block via the ConfirmDialog", async () => {
    blocksMock.mockReturnValue({ data: [makeBlock()], isLoading: false });
    storeState.availabilityBlockDrawer = { open: true, blockId: "block-1" };
    render(<AvailabilityBlockDrawer />);

    const propertySelect = screen.getByLabelText("Property");
    expect(propertySelect).toHaveValue("prop-1");
    expect(propertySelect).toBeDisabled();
    expect(screen.getByLabelText("Start date")).toHaveValue("2026-08-10");
    expect(screen.getByLabelText("End date")).toHaveValue("2026-08-13");
    expect(screen.getByLabelText("Reason")).toHaveValue("owner_block");

    await userEvent.click(screen.getByRole("button", { name: "Remove block" }));

    const dialog = screen.getByRole("dialog", { name: "Remove this block?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Remove block" }));

    expect(deleteMutateAsyncMock).toHaveBeenCalledWith("block-1");
  });
});
