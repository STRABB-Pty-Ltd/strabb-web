import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ListingResponse } from "@/lib/schemas/listing";

const listingCalendarMock = vi.fn();
vi.mock("../listing-calendar", () => ({
  ListingCalendar: (props: { listingId: string; baseNightlyRate: number | null }) => {
    listingCalendarMock(props);
    return <div data-testid="listing-calendar">calendar for {props.listingId}</div>;
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
  nightlyRate: null,
  channexPropertyId: null,
  channexRoomTypeId: null,
  channexRatePlanId: null,
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
    expect(screen.queryByTestId("general")).not.toBeInTheDocument();
    expect(screen.queryByTestId("channex")).not.toBeInTheDocument();
    expect(listingCalendarMock).not.toHaveBeenCalled();
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
    // Calendar must NOT mount until its tab is selected — the listing-state
    // query is heavy and we don't want it firing for every accordion expand.
    expect(listingCalendarMock).not.toHaveBeenCalled();
  });

  it("lazy-mounts ListingCalendar only when the Calendar tab is selected", async () => {
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
    expect(listingCalendarMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: /^Calendar$/ }));
    expect(listingCalendarMock).toHaveBeenCalledWith({
      listingId: "listing-1",
      baseNightlyRate: 250,
    });
  });

  it("renders exactly three tabs (General / Calendar / Channex), retiring the old per-concern tabs", async () => {
    const user = userEvent.setup();
    render(
      <ListingRow
        listing={baseListing}
        generalTabContent={<div>general</div>}
        channexTabContent={<div>channex</div>}
        baseNightlyRate={null}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Beach House/ }));
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: /^General$/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Calendar$/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Channex$/ })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /^Rates$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /^Restrictions$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /^Availability$/ })).not.toBeInTheDocument();
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
