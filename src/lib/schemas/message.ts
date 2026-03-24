export interface MessageTemplateResponse {
  id: string;
  propertyId: string | null;
  templateKey: string;
  subjectTemplate: string;
  bodyTemplate: string;
  triggerType: string;
  triggerDays: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledMessageResponse {
  id: string;
  bookingId: string;
  templateName: string;
  scheduledFor: string;
  status: string;
  recipientEmail: string;
  subject: string | null;
  body: string | null;
  sentAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledMessageListResponse {
  data: ScheduledMessageResponse[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const TRIGGER_TYPE_OPTIONS = [
  { value: "on_confirmation", label: "On booking confirmation" },
  { value: "days_before_checkin", label: "Days before check-in" },
] as const;

export const TEMPLATE_KEY_LABELS: Record<string, string> = {
  booking_confirmation: "Booking Confirmation",
  pre_arrival_reminder: "Pre-arrival Reminder",
  checkin_instructions: "Check-in Instructions",
};
