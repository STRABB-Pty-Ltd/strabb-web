import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: { accessToken: "mock-token" },
    status: "authenticated",
  })),
}));

vi.mock("@/hooks/use-bookings", () => ({
  useUpdateBookingNotes: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDismissConflict: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

vi.mock("@base-ui/react/dialog", async () => {
  const { mockDialogModule } = await import("@/test-utils/mock-dialog");
  return mockDialogModule;
});

import { BookingDetailDialog } from "./booking-detail-dialog";
import type { BookingResponse } from "@/lib/schemas/booking";

const mockBooking: BookingResponse = {
  id: "booking-1",
  listingId: "listing-1",
  propertyId: "property-1",
  guestId: null,
  externalBookingId: "HMA123456",
  idempotencyKey: "airbnb:HMA123456",
  checkIn: "2024-03-15T14:00:00Z",
  checkOut: "2024-03-18T10:00:00Z",
  status: "confirmed",
  conflictStatus: null,
  source: "airbnb",
  guestName: "John Smith",
  guestEmail: "john@example.com",
  rawSummary: "Reserved - HMA123456 (John Smith)",
  notes: "Early check-in requested",
  createdAt: "2024-03-10T00:00:00Z",
  updatedAt: "2024-03-10T00:00:00Z",
};

describe("BookingDetailDialog", () => {
  it("renders booking details when open", () => {
    render(
      <BookingDetailDialog
        booking={mockBooking}
        propertyTimezone="Australia/Sydney"
        open={true}
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText("Booking Details")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText("(john@example.com)")).toBeInTheDocument();
    expect(screen.getByText("HMA123456")).toBeInTheDocument();
  });

  it("shows notes textarea with existing value", () => {
    render(
      <BookingDetailDialog
        booking={mockBooking}
        propertyTimezone="Australia/Sydney"
        open={true}
        onOpenChange={() => {}}
      />,
    );

    const textarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Early check-in requested");
  });

  it("shows conflict alert when conflicted", () => {
    const conflictedBooking = { ...mockBooking, conflictStatus: "conflicted" };
    render(
      <BookingDetailDialog
        booking={conflictedBooking}
        propertyTimezone="Australia/Sydney"
        open={true}
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText("Date conflict detected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dismiss conflict/i })).toBeInTheDocument();
  });

  it("does not show conflict alert when not conflicted", () => {
    render(
      <BookingDetailDialog
        booking={mockBooking}
        propertyTimezone="Australia/Sydney"
        open={true}
        onOpenChange={() => {}}
      />,
    );

    expect(screen.queryByText("Date conflict detected")).not.toBeInTheDocument();
  });

  it("displays dates in property timezone", () => {
    render(
      <BookingDetailDialog
        booking={mockBooking}
        propertyTimezone="Australia/Sydney"
        open={true}
        onOpenChange={() => {}}
      />,
    );

    // 2024-03-15T14:00Z in Sydney (UTC+11 AEDT) = 16 Mar 2024, 1:00 AM
    expect(screen.getByText(/16 Mar 2024/)).toBeInTheDocument();
  });
});
