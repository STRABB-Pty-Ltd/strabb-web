import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ListingResponse } from "@/lib/schemas/listing";

const { listingsMock, updateListingMock, updateMappingMock, resyncMock, addToastMock } = vi.hoisted(
  () => ({
    listingsMock: vi.fn(),
    updateListingMock: vi.fn(),
    updateMappingMock: vi.fn(),
    resyncMock: vi.fn(),
    addToastMock: vi.fn(),
  }),
);

vi.mock("@/lib/api-hooks/listings-api", () => ({
  useListingsAPI: () => listingsMock(),
  useUpdateListing: () => ({ mutate: updateListingMock, isPending: false }),
  useUpdateChannexMapping: () => ({ mutate: updateMappingMock, isPending: false }),
  useChannexResyncListing: () => ({ mutateAsync: resyncMock, isPending: false }),
}));

vi.mock("@/stores/app-store", () => {
  const useAppStore = Object.assign(
    (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
      selector({ addToast: addToastMock }),
    { getState: () => ({ addToast: addToastMock }) },
  );
  return { useAppStore };
});

vi.mock("@/components/overlays/booking-form-drawer", () => ({
  BookingFormDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="booking-form-drawer" /> : null,
}));

import SettingsListingsPage from "./page";

function listing(overrides: Partial<ListingResponse> = {}): ListingResponse {
  return {
    id: "l-1",
    propertyId: "p-1",
    name: "Beach House",
    platform: "airbnb",
    externalListingId: null,
    icalFeedUrl: null,
    syncStatus: "synced",
    lastSyncedAt: null,
    lastSyncError: null,
    isActive: true,
    listingType: "standalone",
    parentId: null,
    nightlyRate: 250,
    channexPropertyId: null,
    channexRoomTypeId: null,
    channexRatePlanId: null,
    children: [],
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

function setup(listings: ListingResponse[]) {
  listingsMock.mockReturnValue({
    data: {
      data: listings,
      meta: { total: listings.length, page: 1, pageSize: 100, totalPages: 1 },
    },
    isLoading: false,
  });
}

async function expandRow(name: RegExp) {
  await userEvent.click(screen.getByRole("button", { name }));
}

describe("SettingsListingsPage", () => {
  beforeEach(() => {
    listingsMock.mockReset();
    updateListingMock.mockReset();
    updateMappingMock.mockReset();
    resyncMock.mockReset();
    addToastMock.mockReset();
  });

  it("renders listing rows from the API", () => {
    setup([listing(), listing({ id: "l-2", name: "City Loft" })]);
    render(<SettingsListingsPage />);

    expect(screen.getByText("Beach House")).toBeInTheDocument();
    expect(screen.getByText("City Loft")).toBeInTheDocument();
  });

  it("saves the base nightly rate via the update-listing mutation with the parsed value", async () => {
    setup([listing({ nightlyRate: 250 })]);
    render(<SettingsListingsPage />);
    await expandRow(/beach house/i);

    const input = screen.getByLabelText("Base nightly rate");
    expect(input).toHaveValue(250);
    await userEvent.clear(input);
    await userEvent.type(input, "300");
    await userEvent.click(screen.getByRole("button", { name: /save metadata/i }));

    expect(updateListingMock).toHaveBeenCalledTimes(1);
    expect(updateListingMock.mock.calls[0][0]).toEqual({ listingId: "l-1", nightlyRate: 300 });
  });

  it("does not render the removed placeholder sections (photos, cleaning fee, stay rules, amenities, description)", async () => {
    setup([listing()]);
    render(<SettingsListingsPage />);
    await expandRow(/beach house/i);

    // Kept: the wired Pricing input and the manual-booking affordance.
    expect(screen.getByText("Pricing")).toBeInTheDocument();
    expect(screen.getByLabelText("Base nightly rate")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add booking/i })).toBeInTheDocument();

    // Removed: dead affordances must be gone from the DOM, not hidden.
    expect(screen.queryByText("Photos")).not.toBeInTheDocument();
    expect(screen.queryByText(/drag images here/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Cleaning fee")).not.toBeInTheDocument();
    expect(screen.queryByText("Stay rules")).not.toBeInTheDocument();
    expect(screen.queryByText("Min nights")).not.toBeInTheDocument();
    expect(screen.queryByText("Amenities")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("opens the booking drawer from the per-listing Add Booking button", async () => {
    setup([listing()]);
    render(<SettingsListingsPage />);
    await expandRow(/beach house/i);

    expect(screen.queryByTestId("booking-form-drawer")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /add booking/i }));
    expect(screen.getByTestId("booking-form-drawer")).toBeInTheDocument();
  });
});
