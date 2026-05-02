export type CleaningStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

export type CleaningPriority = "low" | "medium" | "high" | "urgent";

export type CleaningType =
  | "checkout"
  | "checkin"
  | "deep_clean"
  | "mid_stay"
  | "inspection"
  | "turnover";

export interface CleaningTask {
  id: string;
  listingId: string;
  listingName: string;
  listingColor: string;
  bookingId: string | null;
  cleanerName: string | null;
  cleanerEmail: string | null;
  scheduledTime: string;
  completedTime: string | null;
  checklistTotal: number;
  checklistDone: number;
  priority: CleaningPriority;
  status: CleaningStatus;
  type: CleaningType;
  estimatedHours: number;
  notes: string | null;
  linkedTicketId: string | null;
}
