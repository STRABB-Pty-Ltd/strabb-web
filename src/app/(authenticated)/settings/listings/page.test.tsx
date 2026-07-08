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
  useChannexResyncListing: () => ({ mutate: resyncMock, isPending: false }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => propertiesMock(),
  useUpdateProperty: () => ({ mutate: updatePropertyMutateMock, isPending: false }),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({ addToast: addToastMock, selectedListings: [] }),
}));

vi.mock("@/components/overlays/booking-form-drawer", () => ({
  BookingFormDrawer: () => null,
}));

import SettingsListingsPage from "./page";

function listing(overrides: Partial<ListingResponse> = {}): ListingResponse {
  return {
    id: "listing-1",
    propertyId: "prop-1",
    name: "Beach House",
    platform: "airbnb",
    externalListingId: null,
    icalFeedUrl: null,
    syncStatus: "pending",
    lastSyncedAt: null,
    lastSyncError: null,
    isActive: true,
    listingType: "standalone",
    parentId: null,
    nightlyRate: null,
    channexPropertyId: null,
    channexRoomTypeId: null,
    channexRatePlanId: null,
    children: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function property(overrides: Partial<PropertyResponse> = {}): PropertyResponse {
  return {
    id: "prop-1",
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

async function expandRow(name: string | RegExp) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name }));
  return user;
}

describe("SettingsListingsPage - per-property cleaning duration", () => {
  beforeEach(() => {
    listingsMock.mockReset();
    propertiesMock.mockReset();
    updatePropertyMutateMock.mockReset();
    updateListingMock.mockReset();
    updateMappingMock.mockReset();
    resyncMock.mockReset();
    addToastMock.mockReset();

    listingsMock.mockReturnValue({ data: { data: [listing()] }, isLoading: false });
    propertiesMock.mockReturnValue({ data: { data: [property()] } });
  });

  it("renders the stored cleaning duration once the row is expanded", async () => {
    render(<SettingsListingsPage />);
    await expandRow(/Beach House/);

    expect(screen.getByLabelText(/Cleaning duration/i)).toHaveValue(120);
  });

  it("shares the same stored value across two listings on the same property", async () => {
    listingsMock.mockReturnValue({
      data: {
        data: [
          listing({ id: "listing-1", name: "Unit A", propertyId: "prop-1" }),
          listing({ id: "listing-2", name: "Unit B", propertyId: "prop-1" }),
        ],
      },
      isLoading: false,
    });

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
      { id: "prop-1", data: { cleaningDurationMinutes: 90 } },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
        onSettled: expect.any(Function),
      }),
    );
  });
});
