import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BookingResponse } from "@/lib/schemas/booking";

const {
  addToastMock,
  openDrillDownPanelMock,
  listingsMock,
  bookingsMock,
  createMutateAsyncMock,
  updateMutateAsyncMock,
} = vi.hoisted(() => ({
  addToastMock: vi.fn(),
  openDrillDownPanelMock: vi.fn(),
  listingsMock: vi.fn(),
  bookingsMock: vi.fn(),
  createMutateAsyncMock: vi.fn(),
  updateMutateAsyncMock: vi.fn(),
}));

const storeState = {
  addToast: addToastMock,
  openDrillDownPanel: openDrillDownPanelMock,
};

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

vi.mock("@/hooks/use-listings", () => ({
  useListings: () => listingsMock(),
}));

vi.mock("@/hooks/use-bookings", () => ({
  useBookings: () => bookingsMock(),
  useCreateBooking: () => ({ mutateAsync: createMutateAsyncMock, isPending: false }),
  useUpdateBooking: () => ({ mutateAsync: updateMutateAsyncMock, isPending: false }),
}));

import { BookingFormDrawer } from "./booking-form-drawer";

function makeBooking(overrides: Partial<BookingResponse> = {}): BookingResponse {
  return {
    id: "book-1",
    listingId: "listing-1",
    propertyId: "prop-1",
    guestId: null,
    externalBookingId: null,
    idempotencyKey: "idem-1",
    checkIn: "2026-08-10T00:00:00Z",
    checkOut: "2026-08-13T00:00:00Z",
    status: "confirmed",
    conflictStatus: "clear",
    source: "direct",
    guestName: "Existing Guest",
    guestEmail: null,
    guestPhone: null,
    guestCount: null,
    totalAmount: null,
    nightlyRate: null,
    specialRequests: null,
    otaCommission: null,
    rawSummary: null,
    notes: null,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

const onCloseMock = vi.fn();

describe("BookingFormDrawer", () => {
  beforeEach(() => {
    addToastMock.mockReset();
    openDrillDownPanelMock.mockReset();
    listingsMock.mockReset();
    bookingsMock.mockReset();
    createMutateAsyncMock.mockReset();
    updateMutateAsyncMock.mockReset();
    onCloseMock.mockReset();

    listingsMock.mockReturnValue({
      data: {
        data: [
          { id: "listing-1", name: "Beach House Listing" },
          { id: "listing-2", name: "City Loft Listing" },
        ],
      },
      isLoading: false,
    });
    bookingsMock.mockReturnValue({ data: { data: [] }, isLoading: false });
  });

  it("create mode without a listingId renders the listing picker; choosing one passes it to create.mutateAsync", async () => {
    render(<BookingFormDrawer open onClose={onCloseMock} mode={{ kind: "create" }} />);

    expect(screen.getByLabelText("Listing")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Listing"), "listing-2");
    fireEvent.change(screen.getByLabelText("Check-in"), { target: { value: "2026-08-01T10:00" } });
    fireEvent.change(screen.getByLabelText("Check-out"), { target: { value: "2026-08-05T10:00" } });

    await userEvent.click(screen.getByRole("button", { name: /create booking/i }));

    expect(createMutateAsyncMock).toHaveBeenCalledTimes(1);
    expect(createMutateAsyncMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({ listingId: "listing-2" }),
    );
  });

  it("create mode with a listingId does not render the listing picker", () => {
    render(
      <BookingFormDrawer
        open
        onClose={onCloseMock}
        mode={{ kind: "create", listingId: "listing-1" }}
      />,
    );

    expect(screen.queryByLabelText("Listing")).not.toBeInTheDocument();
  });

  it("shows a date-order validation error and does not create when check-out is before check-in", async () => {
    render(
      <BookingFormDrawer
        open
        onClose={onCloseMock}
        mode={{ kind: "create", listingId: "listing-1" }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Check-in"), { target: { value: "2026-08-10T10:00" } });
    fireEvent.change(screen.getByLabelText("Check-out"), { target: { value: "2026-08-05T10:00" } });
    await userEvent.click(screen.getByRole("button", { name: /create booking/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Check-out must be after check-in");
    expect(createMutateAsyncMock).not.toHaveBeenCalled();
  });

  it("shows the overlap advisory and still allows saving when the dates conflict with an existing booking", async () => {
    bookingsMock.mockReturnValue({
      data: {
        data: [
          makeBooking({
            id: "book-overlap",
            checkIn: "2026-08-10T00:00:00Z",
            checkOut: "2026-08-13T00:00:00Z",
          }),
        ],
      },
      isLoading: false,
    });
    render(
      <BookingFormDrawer
        open
        onClose={onCloseMock}
        mode={{ kind: "create", listingId: "listing-1" }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Check-in"), { target: { value: "2026-08-11T10:00" } });
    fireEvent.change(screen.getByLabelText("Check-out"), { target: { value: "2026-08-12T10:00" } });

    expect(screen.getByRole("status")).toHaveTextContent(/heads up/i);

    await userEvent.click(screen.getByRole("button", { name: /create booking/i }));
    expect(createMutateAsyncMock).toHaveBeenCalledTimes(1);
  });

  it("does not show the overlap advisory when the dates do not conflict (false-pass guard)", () => {
    bookingsMock.mockReturnValue({
      data: {
        data: [
          makeBooking({
            id: "book-overlap",
            checkIn: "2026-08-10T00:00:00Z",
            checkOut: "2026-08-13T00:00:00Z",
          }),
        ],
      },
      isLoading: false,
    });
    render(
      <BookingFormDrawer
        open
        onClose={onCloseMock}
        mode={{ kind: "create", listingId: "listing-1" }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Check-in"), { target: { value: "2026-09-01T10:00" } });
    fireEvent.change(screen.getByLabelText("Check-out"), { target: { value: "2026-09-05T10:00" } });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("cancel flow opens the styled ConfirmDialog and cancels via mutateAsync, never window.confirm", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const editingBooking = makeBooking({ id: "book-edit", status: "confirmed" });

    render(
      <BookingFormDrawer
        open
        onClose={onCloseMock}
        mode={{ kind: "edit", booking: editingBooking }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel booking" }));

    const dialog = screen.getByRole("dialog", { name: "Cancel this booking?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel booking" }));

    expect(updateMutateAsyncMock).toHaveBeenCalledWith({ id: "book-edit", status: "cancelled" });
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
