import type { ShoppingItem } from "@/types/shopping-item";
import { REFERENCE_NOW } from "./reference-date";

const day = (offset: number) => {
  const d = new Date(REFERENCE_NOW);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().split("T")[0];
};

const defaults: ShoppingItem = {
  id: "si-001",
  listingId: "lst-002",
  listingName: "Bondi Beach Apartment — Unit A",
  item: "Bath towels (set of 4)",
  quantity: 2,
  status: "requested",
  requestedDate: day(-3),
  priority: "medium",
  notes: null,
};

export function createShoppingItem(overrides?: Partial<ShoppingItem>): ShoppingItem {
  return { ...defaults, ...overrides };
}

export const mockShoppingItemList: ShoppingItem[] = [
  createShoppingItem(),
  createShoppingItem({
    id: "si-002",
    listingId: "lst-004",
    listingName: "Manly Surf Lodge",
    item: "Dishwasher tablets",
    quantity: 1,
    status: "approved",
    requestedDate: day(-5),
    priority: "low",
  }),
  createShoppingItem({
    id: "si-003",
    listingId: "lst-005",
    listingName: "Coogee Bay Studio",
    item: "Toilet paper (12-pack)",
    quantity: 3,
    status: "purchased",
    requestedDate: day(-7),
    priority: "high",
  }),
  createShoppingItem({
    id: "si-004",
    listingId: "lst-006",
    listingName: "Newtown Terrace",
    item: "Coffee pods (Nespresso)",
    quantity: 2,
    status: "requested",
    requestedDate: day(-1),
    priority: "medium",
    notes: "Guest prefers decaf — check Aldi stock first",
  }),
  createShoppingItem({
    id: "si-005",
    listingId: "lst-007",
    listingName: "Surry Hills Loft",
    item: "Pillow protectors",
    quantity: 4,
    status: "approved",
    requestedDate: day(-4),
    priority: "low",
  }),
  createShoppingItem({
    id: "si-006",
    listingId: "lst-003",
    listingName: "Bondi Beach Apartment — Unit B",
    item: "Hand soap refill",
    quantity: 2,
    status: "requested",
    requestedDate: day(-2),
    priority: "medium",
  }),
  createShoppingItem({
    id: "si-007",
    listingId: "lst-004",
    listingName: "Manly Surf Lodge",
    item: "Beach umbrellas",
    quantity: 2,
    status: "purchased",
    requestedDate: day(-10),
    priority: "low",
    notes: "Replacement for broken ones",
  }),
  createShoppingItem({
    id: "si-008",
    listingId: "lst-002",
    listingName: "Bondi Beach Apartment — Unit A",
    item: "Light bulbs (LED warm white)",
    quantity: 6,
    status: "approved",
    requestedDate: day(-3),
    priority: "high",
    notes: "Bedroom and bathroom",
  }),
];
