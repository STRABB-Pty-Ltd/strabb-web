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
    { id: "bookings", label: "Bookings", behavior: "exclusive" },
    { id: "cleaning", label: "Cleaning", behavior: "exclusive" },
    { id: "vacancy", label: "Vacancy", behavior: "exclusive" },
    { id: "ticket", label: "Tickets", behavior: "exclusive" },
  ],
  messaging: [
    { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
    { id: "unread", label: "Unread", behavior: "exclusive" },
    { id: "flagged", label: "Flagged", behavior: "exclusive" },
    { id: "read", label: "Read", behavior: "exclusive" },
    { id: "archived", label: "Archived", behavior: "exclusive" },
  ],
  operations: [
    { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
    { id: "cleaning", label: "Cleaning", behavior: "exclusive" },
    { id: "tickets", label: "Tickets", behavior: "exclusive" },
  ],
  reporting: [
    { id: "overview", label: "Overview", behavior: "single-default", defaultActive: true },
    { id: "revenue", label: "Revenue", behavior: "exclusive" },
    { id: "expenses", label: "Expenses", behavior: "exclusive" },
    { id: "bookings", label: "Bookings", behavior: "exclusive" },
    { id: "more", label: "More", behavior: "more-dropdown" },
  ],
};
