export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

export interface Ticket {
  id: string;
  propertyId: string;
  listingId: string | null;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  dateReported: string;
  dateScheduled: string | null;
  dateCompleted: string | null;
  cost: number | null;
  currency?: string;
  notes: string | null;
  linkedCleanId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketListResponse {
  data: Ticket[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const TICKET_PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const TICKET_STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
