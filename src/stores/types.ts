export type PageId =
  | "dashboard"
  | "calendar"
  | "messaging"
  | "cleaning"
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

export interface SavedReport {
  id: string;
  name: string;
  timeframe: string;
  submenu: string[];
  createdAt: string;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}
