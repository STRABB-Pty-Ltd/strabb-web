import type { PageId } from "@/stores/types";

export type ChipBehavior =
  | "single-default"
  | "toggle"
  | "multi"
  | "exclusive"
  | "more-dropdown"
  | "nav";

export interface SubmenuChip {
  id: string;
  label: string;
  behavior: ChipBehavior;
  defaultActive?: boolean;
  /** For behavior === "nav": the route to navigate to when clicked. */
  href?: string;
}

export const submenuConfigs: Record<Exclude<PageId, "settings">, SubmenuChip[]> = {
  dashboard: [
    { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
    { id: "compare", label: "Compare", behavior: "toggle" },
  ],
  calendar: [
    { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
    { id: "bookings", label: "Bookings", behavior: "multi" },
    { id: "cleaning", label: "Cleaning", behavior: "multi" },
    { id: "vacancy", label: "Vacancy", behavior: "multi" },
    { id: "ticket", label: "Tickets", behavior: "multi" },
  ],
  messaging: [
    { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
    { id: "unread", label: "Unread", behavior: "multi" },
    { id: "flagged", label: "Flagged", behavior: "multi" },
    { id: "read", label: "Read", behavior: "multi" },
    { id: "archived", label: "Archived", behavior: "exclusive" },
  ],
  cleaning: [
    { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
    { id: "tickets", label: "Tickets", behavior: "nav", href: "/properties/tickets" },
    { id: "confirmed", label: "Confirmed", behavior: "multi" },
    { id: "pending", label: "Pending", behavior: "multi" },
    { id: "archived", label: "Archived", behavior: "exclusive" },
  ],
  reporting: [
    { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
    { id: "revenue", label: "Revenue", behavior: "multi" },
    { id: "expenses", label: "Expenses", behavior: "multi" },
    { id: "bookings", label: "Bookings", behavior: "multi" },
    { id: "more", label: "More", behavior: "more-dropdown" },
  ],
};
