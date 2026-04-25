export type MaintenancePriority = "low" | "medium" | "high" | "urgent";

export type MaintenanceStatus =
  | "reported"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Maintenance {
  id: string;
  propertyId: string;
  listingId: string | null;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  dateReported: string;
  dateScheduled: string | null;
  dateCompleted: string | null;
  cost: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceListResponse {
  data: Maintenance[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const MAINTENANCE_PRIORITY_OPTIONS: { value: MaintenancePriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const MAINTENANCE_STATUS_OPTIONS: { value: MaintenanceStatus; label: string }[] = [
  { value: "reported", label: "Reported" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
