import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ListingResponse } from "@/lib/schemas/listing";
import type { PropertyResponse } from "@/lib/schemas/property";

const {
  listingsMock,
  propertiesMock,
  updatePropertyMutateMock,
  updateListingMock,
  updateMappingMock,
  resyncMock,
  addToastMock,
} = vi.hoisted(() => ({
  listingsMock: vi.fn(),
  propertiesMock: vi.fn(),
  updatePropertyMutateMock: vi.fn(),
  updateListingMock: vi.fn(),
  updateMappingMock: vi.fn(),
  resyncMock: vi.fn(),
  addToastMock: vi.fn(),
}));

vi.mock("@/lib/api-hooks/listings-api", () => ({
  useListingsAPI: () => listingsMock(),
  useUpdateListing: () => ({ mutate: updateListingMock, isPending: false }),
  useUpdateChannexMapping: () => ({ mutate: updateMappingMock, isPending: false }),
  useChannexResyncListing: () => ({ mutateAsync: resyncMock, isPending: false }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => propertiesMock(),
  useUpdateProperty: () => ({ mutate: updatePropertyMutateMock, isPending: false }),
}));

// page.tsx's resync handler calls useAppStore.getState().addToast(...) directly
// (imperative, outside a component render), alongside the normal hook-selector
// usage elsewhere on the page - the mock needs to support both call shapes.
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

function property(overrides: Partial<PropertyResponse> = {}): PropertyResponse {
  return {
    id: "p-1",
    name: "Beach House Property",
    address: null,
    timezone: "Australia/Sydney",
    cleaningDurationMinutes: 120,
    accessInstructions: null,
    notes: null,
    cleanerName: null,
    cleanerEmail: null,
    cleanerPhone: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
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

async function expandRow(name: string | RegExp) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name }));
  return user;
}

describe("SettingsListingsPage", () => {
  beforeEach(() => {
    listingsMock.mockReset();
    propertiesMock.mockReset();
    updatePropertyMutateMock.mockReset();
    updateListingMock.mockReset();
    updateMappingMock.mockReset();
    resyncMock.mockReset();
    addToastMock.mockReset();

    setup([listing()]);
    propertiesMock.mockReturnValue({ data: { data: [property()] } });
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

  it("renders the stored cleaning duration once the row is expanded", async () => {
    render(<SettingsListingsPage />);
    await expandRow(/Beach House/);

    expect(screen.getByLabelText(/Cleaning duration/i)).toHaveValue(120);
  });

  it("shares the same stored value across two listings on the same property", async () => {
    setup([
      listing({ id: "listing-1", name: "Unit A", propertyId: "p-1" }),
      listing({ id: "listing-2", name: "Unit B", propertyId: "p-1" }),
    ]);

    render(<SettingsListingsPage />);
    await expandRow(/Unit A/);
    await expandRow(/Unit B/);

    const inputs = screen.getAllByLabelText(/Cleaning duration/i);
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue(120);
    expect(inputs[1]).toHaveValue(120);
  });

  // Only the General tab is mounted by default (ListingRow lazy-mounts tabs),
  // and its Cleaning-duration button is the only one in the DOM labelled
  // exactly "Save" (not "Save metadata", "Saved", or the Channex tab's own
  // "Save", which isn't mounted since that tab isn't selected).
  it("rejects a non-integer value and does not call the save mutation", async () => {
    render(<SettingsListingsPage />);
    const user = await expandRow(/Beach House/);
    const input = screen.getByLabelText(/Cleaning duration/i);
    await user.clear(input);
    await user.type(input, "2.5");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updatePropertyMutateMock).not.toHaveBeenCalled();
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        message: expect.stringMatching(/whole number/i),
      }),
    );
  });

  it("rejects an out-of-range value and does not call the save mutation", async () => {
    render(<SettingsListingsPage />);
    const user = await expandRow(/Beach House/);
    const input = screen.getByLabelText(/Cleaning duration/i);
    await user.clear(input);
    await user.type(input, "1500");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updatePropertyMutateMock).not.toHaveBeenCalled();
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error", message: expect.stringMatching(/0 to 1440/i) }),
    );
  });

  // handleCleaningDurationSave's own `parsed === property.cleaningDurationMinutes`
  // guard (the "Nothing to save" toast) looks unreachable through the actual UI:
  // a number input normalises "120.0" back to "120" on entry, so the button's
  // own string-based dirty check (`value.trim() !== String(storedMinutes)`)
  // is always false whenever the parsed values would be equal - the button
  // stays disabled and labelled "Saved" rather than becoming clickable with a
  // numerically-equal-but-string-different value. Not adding a forced test for
  // it (there is no real interaction path to trigger it), flagging it here in
  // case it is worth a follow-up: as-is it is likely dead code.

  it("saves a valid changed value against the property id, not the listing id", async () => {
    render(<SettingsListingsPage />);
    const user = await expandRow(/Beach House/);
    const input = screen.getByLabelText(/Cleaning duration/i);
    await user.clear(input);
    await user.type(input, "90");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updatePropertyMutateMock).toHaveBeenCalledWith(
      { id: "p-1", data: { cleaningDurationMinutes: 90 } },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
        onSettled: expect.any(Function),
      }),
    );
  });
});
