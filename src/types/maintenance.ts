export type MaintenancePriority = "low" | "medium" | "high" | "urgent";

export type MaintenanceStatus =
  | "reported"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Maintenance {
  id: string;
  listingId: string;
  listingName: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  dateReported: string;
  dateScheduled: string | null;
  notes: string | null;
}
