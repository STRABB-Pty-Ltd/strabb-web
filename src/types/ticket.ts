export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketStatus = "pending" | "confirmed" | "completed";

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
  cost: string | null;
  notes: string | null;
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
  { value: "completed", label: "Completed" },
];
