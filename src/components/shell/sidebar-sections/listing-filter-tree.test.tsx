import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useListingsMock } = vi.hoisted(() => ({ useListingsMock: vi.fn() }));

vi.mock("@/hooks/use-listings", () => ({
  useListings: () => useListingsMock(),
}));

import { useAppStore } from "@/stores/app-store";
import { ListingFilterTree } from "./listing-filter-tree";

const listings = [
  {
    id: "lst-lodge",
    name: "Bannockburn Lodge",
    relationship: "standalone",
    parentId: null,
    children: [],
    color: "#000",
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    nightlyRate: 200,
    location: "x",
    propertyId: "p1",
    isActive: true,
  },
  {
    id: "lst-cottage",
    name: "Bannockburn Cottage",
    relationship: "standalone",
    parentId: null,
    children: [],
    color: "#000",
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    nightlyRate: 150,
    location: "x",
    propertyId: "p1",
    isActive: true,
  },
];

describe("ListingFilterTree live selection", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
    useListingsMock.mockReturnValue({ data: { data: listings } });
  });

  it("flips the clicked chip to active and updates selectedListings", async () => {
    const user = userEvent.setup();
    render(<ListingFilterTree />);

    const lodge = screen.getByRole("button", { name: "Bannockburn Lodge" });
    expect(lodge).toHaveAttribute("aria-pressed", "false");

    await user.click(lodge);

    expect(useAppStore.getState().selectedListings).toEqual(["lst-lodge"]);
    expect(screen.getByRole("button", { name: "Bannockburn Lodge" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
