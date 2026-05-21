import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ListingResponse } from "@/lib/schemas/listing";

const ratesCalendarMock = vi.fn();
vi.mock("../rates-calendar", () => ({
  RatesCalendar: (props: { listingId: string; baseNightlyRate: number | null }) => {
    ratesCalendarMock(props);
    return <div data-testid="rates-calendar">rates for {props.listingId}</div>;
  },
}));

const restrictionsCalendarMock = vi.fn();
vi.mock("../restrictions-calendar", () => ({
  RestrictionsCalendar: (props: { listingId: string }) => {
    restrictionsCalendarMock(props);
    return <div data-testid="restrictions-calendar">restrictions for {props.listingId}</div>;
  },
}));

import { ListingRow } from "../listing-row";

const baseListing: ListingResponse = {
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
  channexPropertyId: null,
  children: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("ListingRow", () => {
  it("renders the listing name and platform in the collapsed header", () => {
    render(
      <ListingRow
        listing={baseListing}
        generalTabContent={<div>general body</div>}
        channexTabContent={<div>channex body</div>}
        baseNightlyRate={null}
      />,
    );
    expect(screen.getByText("Beach House")).toBeInTheDocument();
    expect(screen.getByText("airbnb")).toBeInTheDocument();
  });

  it("does NOT mount tab content while collapsed (lazy-mount guard)", () => {
    render(
      <ListingRow
        listing={baseListing}
        generalTabContent={<div data-testid="general">general body</div>}
        channexTabContent={<div data-testid="channex">channex body</div>}
        baseNightlyRate={null}
      />,
    );
    // Tab panels not rendered → general/channex bodies absent from the DOM
    expect(screen.queryByTestId("general")).not.toBeInTheDocument();
    expect(screen.queryByTestId("channex")).not.toBeInTheDocument();
    expect(ratesCalendarMock).not.toHaveBeenCalled();
    expect(restrictionsCalendarMock).not.toHaveBeenCalled();
  });

  it("mounts the General tab content when expanded (default tab)", async () => {
    const user = userEvent.setup();
    render(
      <ListingRow
        listing={baseListing}
        generalTabContent={<div data-testid="general">general body</div>}
        channexTabContent={<div data-testid="channex">channex body</div>}
        baseNightlyRate={null}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Beach House/ }));
    expect(screen.getByTestId("general")).toBeInTheDocument();
    // Rates calendar must NOT mount until the Rates tab is selected.
    expect(ratesCalendarMock).not.toHaveBeenCalled();
  });

  it("lazy-mounts RatesCalendar only when the Rates tab is selected", async () => {
    const user = userEvent.setup();
    render(
      <ListingRow
        listing={baseListing}
        generalTabContent={<div data-testid="general">general body</div>}
        channexTabContent={<div data-testid="channex">channex body</div>}
        baseNightlyRate={250}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Beach House/ }));
    await user.click(screen.getByRole("tab", { name: /^Rates$/ }));
    expect(ratesCalendarMock).toHaveBeenCalledWith({
      listingId: "listing-1",
      baseNightlyRate: 250,
    });
    // The restrictions calendar should NOT mount until its own tab is chosen.
    expect(restrictionsCalendarMock).not.toHaveBeenCalled();
  });

  it("lazy-mounts RestrictionsCalendar only when the Restrictions tab is selected", async () => {
    const user = userEvent.setup();
    render(
      <ListingRow
        listing={baseListing}
        generalTabContent={<div data-testid="general">general body</div>}
        channexTabContent={<div data-testid="channex">channex body</div>}
        baseNightlyRate={null}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Beach House/ }));
    expect(restrictionsCalendarMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: /^Restrictions$/ }));
    expect(restrictionsCalendarMock).toHaveBeenCalledWith({ listingId: "listing-1" });
  });

  it("shows the Channex badge in the header for mapped listings", () => {
    render(
      <ListingRow
        listing={{ ...baseListing, channexPropertyId: "chx-001" }}
        generalTabContent={<div>general</div>}
        channexTabContent={<div>channex</div>}
        baseNightlyRate={null}
      />,
    );
    expect(screen.getByText("Channex")).toBeInTheDocument();
  });

  it("hides the Channex badge for unmapped listings", () => {
    render(
      <ListingRow
        listing={baseListing}
        generalTabContent={<div>general</div>}
        channexTabContent={<div>channex</div>}
        baseNightlyRate={null}
      />,
    );
    expect(screen.queryByText("Channex")).not.toBeInTheDocument();
  });
});
