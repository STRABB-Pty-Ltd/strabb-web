export interface CleaningTaskResponse {
  id: string;
  bookingId: string;
  propertyId: string;
  listingId: string | null;
  cleanerName: string | null;
  cleanerEmail: string | null;
  cleanerPhone: string | null;
  // Set when a real team user (role CLEANER) is assigned via the picker. The
  // API denormalises that user's name/email/phone into the free-text trio above,
  // which doubles as the fallback for a one-off cleaner (assignedUserId null).
  assignedUserId: string | null;
  scheduledDate: string;
  status: string;
  notes: string | null;
  linkedTicketId: string | null;
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
