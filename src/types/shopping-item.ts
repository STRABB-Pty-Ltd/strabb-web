export type ShoppingItemStatus = "requested" | "approved" | "purchased";

export type ShoppingItemPriority = "low" | "medium" | "high";

export interface ShoppingItem {
  id: string;
  listingId: string;
  listingName: string;
  item: string;
  quantity: number;
  status: ShoppingItemStatus;
  requestedDate: string;
  priority: ShoppingItemPriority;
  notes: string | null;
}
