export interface CleaningTaskResponse {
  id: string;
  bookingId: string;
  propertyId: string;
  cleanerName: string | null;
  cleanerEmail: string | null;
  cleanerPhone: string | null;
  scheduledDate: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CleaningTaskListResponse {
  data: CleaningTaskResponse[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface CleaningTaskSummaryResponse {
  total: number;
  pending: number;
  scheduled: number;
  notified: number;
  completed: number;
  failed: number;
}

export const TASK_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "notified", label: "Notified" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
] as const;
