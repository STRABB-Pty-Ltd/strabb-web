import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BookingResponse } from "@/lib/schemas/booking";

const addToastMock = vi.fn();
const closeDrillDownPanelMock = vi.fn();

const storeState = {
  drillDownPanel: null as { open: boolean; type: string; itemId: string } | null,
  closeDrillDownPanel: closeDrillDownPanelMock,
  addToast: addToastMock,
};

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

const bookingMock = vi.fn();
const updateNotesMock = vi.fn();
const dismissConflictMock = vi.fn();

vi.mock("@/hooks/use-bookings", () => ({
  useBooking: () => bookingMock(),
  useUpdateBookingNotes: () => ({ mutate: updateNotesMock, isPending: false }),
  useDismissConflict: () => ({ mutate: dismissConflictMock, isPending: false }),
}));

import { BookingDetailDrawer } from "./booking-detail-drawer";

const baseBooking: BookingResponse = {
  id: "book-1",
  listingId: "lst-1",
  propertyId: "prop-1",
  guestId: null,
  externalBookingId: "ABNB-X1",
  idempotencyKey: "abc",
  checkIn: "2026-04-26T15:00:00Z",
  checkOut: "2026-04-29T11:00:00Z",
  status: "confirmed",
  conflictStatus: "clear",
  source: "airbnb",
  guestName: "Sam Guest",
  guestEmail: "sam@example.com",
  rawSummary: null,
  notes: "Late check-in agreed",
  createdAt: "2026-04-20T00:00:00Z",
  updatedAt: "2026-04-20T00:00:00Z",
};

describe("BookingDetailDrawer", () => {
  beforeEach(() => {
    addToastMock.mockReset();
    closeDrillDownPanelMock.mockReset();
    bookingMock.mockReset();
    updateNotesMock.mockReset();
    dismissConflictMock.mockReset();
    storeState.drillDownPanel = null;
  });

  it("renders nothing when drill-down is not a booking", () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: "task-1" };
    bookingMock.mockReturnValue({ data: null, isLoading: false });
    const { container } = render(<BookingDetailDrawer />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders booking details when drill-down opens", () => {
    storeState.drillDownPanel = { open: true, type: "booking", itemId: baseBooking.id };
    bookingMock.mockReturnValue({ data: baseBooking, isLoading: false });
    render(<BookingDetailDrawer />);

    expect(screen.getByText("airbnb")).toBeInTheDocument();
    expect(screen.getByText("Sam Guest")).toBeInTheDocument();
    expect(screen.getByText("ABNB-X1")).toBeInTheDocument();
  });

  it("hides the dismiss-conflict block for non-conflicted bookings", () => {
    storeState.drillDownPanel = { open: true, type: "booking", itemId: baseBooking.id };
    bookingMock.mockReturnValue({ data: baseBooking, isLoading: false });
    render(<BookingDetailDrawer />);

    expect(screen.queryByRole("button", { name: /dismiss conflict/i })).not.toBeInTheDocument();
  });

  it("shows dismiss-conflict and calls mutation when conflicted", async () => {
    storeState.drillDownPanel = { open: true, type: "booking", itemId: baseBooking.id };
    bookingMock.mockReturnValue({
      data: { ...baseBooking, conflictStatus: "conflicted" },
      isLoading: false,
    });
    dismissConflictMock.mockImplementation((_id, { onSuccess }) => onSuccess());

    render(<BookingDetailDrawer />);
    await userEvent.click(screen.getByRole("button", { name: /dismiss conflict/i }));

    expect(dismissConflictMock).toHaveBeenCalledWith(baseBooking.id, expect.any(Object));
    expect(closeDrillDownPanelMock).toHaveBeenCalled();
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", message: "Conflict dismissed" }),
    );
  });

  it("disables the Save notes button until notes change", async () => {
    storeState.drillDownPanel = { open: true, type: "booking", itemId: baseBooking.id };
    bookingMock.mockReturnValue({ data: baseBooking, isLoading: false });
    render(<BookingDetailDrawer />);

    expect(screen.getByRole("button", { name: /save notes/i })).toBeDisabled();

    const textarea = screen.getByLabelText(/notes/i);
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Updated note");

    const save = screen.getByRole("button", { name: /save notes/i });
    expect(save).toBeEnabled();
    await userEvent.click(save);
    expect(updateNotesMock).toHaveBeenCalledWith(
      { id: baseBooking.id, notes: "Updated note" },
      expect.any(Object),
    );
  });

  it("shows 'not found' message when no booking returned", () => {
    storeState.drillDownPanel = { open: true, type: "booking", itemId: "missing" };
    bookingMock.mockReturnValue({ data: null, isLoading: false });
    render(<BookingDetailDrawer />);

    expect(screen.getByText(/booking not found/i)).toBeInTheDocument();
  });
});
