export interface CleaningTaskResponse {
  id: string;
  bookingId: string;
  propertyId: string;
  listingId: string | null;
  cleanerName: string | null;
  cleanerEmail: string | null;
  cleanerPhone: string | null;
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
