export type PageId =
  | "dashboard"
  | "calendar"
  | "messaging"
  | "operations"
  | "reporting"
  | "settings";

export interface CustomGroup {
  id: string;
  name: string;
  listingIds: string[];
}

export interface DrillDownState {
  type: string;
  itemId: string;
  label: string;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  /** Optional single action rendered as a button on the toast (sonner action). */
  action?: { label: string; onClick: () => void };
}
