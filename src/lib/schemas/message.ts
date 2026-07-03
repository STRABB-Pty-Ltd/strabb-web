import { z } from "zod";

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

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ScheduledMessageListResponse {
  data: ScheduledMessageResponse[];
  meta: PaginationMeta;
}

export interface MessageLogResponse {
  id: string;
  scheduledMessageId: string;
  event: string;
  details: string | null;
  providerResponse: string | null;
  createdAt: string;
}

export interface MessageLogListResponse {
  data: MessageLogResponse[];
  meta: PaginationMeta;
}

export const SCHEDULED_MESSAGE_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export type ScheduledMessageStatus = (typeof SCHEDULED_MESSAGE_STATUS_OPTIONS)[number]["value"];

export const TRIGGER_TYPE_OPTIONS = [
  { value: "on_confirmation", label: "On booking confirmation" },
  { value: "days_before_checkin", label: "Days before check-in" },
] as const;

export const TEMPLATE_KEY_LABELS: Record<string, string> = {
  booking_confirmation: "Booking Confirmation",
  pre_arrival_reminder: "Pre-arrival Reminder",
  checkin_instructions: "Check-in Instructions",
};

/**
 * The exact set of substitution tokens the backend's render_template supports
 * (strabb-api app/services/guest_message.py). A template body/subject may only
 * use these; any other {token} is left raw at send time, so the authoring UI
 * offers exactly these seven and the live preview leaves unknown tokens visible.
 */
export const MESSAGE_TEMPLATE_TOKENS = [
  "guest_name",
  "property_name",
  "property_address",
  "check_in_date",
  "check_out_date",
  "access_instructions",
  "host_name",
] as const;

export type MessageTemplateToken = (typeof MESSAGE_TEMPLATE_TOKENS)[number];

/**
 * Sample values used only by the client-side live preview. They mirror what the
 * backend would substitute for a real booking so the author sees a realistic
 * render. Dates are DD-MM-YYYY to match the app's display convention.
 */
export const MESSAGE_TEMPLATE_PREVIEW_VALUES: Record<MessageTemplateToken, string> = {
  guest_name: "Sarah Chen",
  property_name: "The Vale, Toowoomba",
  property_address: "12 Ruthven St, Toowoomba QLD 4350",
  check_in_date: "26-04-2026",
  check_out_date: "29-04-2026",
  access_instructions: "Lockbox 4821, front door",
  host_name: "Will",
};

/**
 * Substitute {token} -> value for every KNOWN token, leaving any unknown token
 * visibly raw (e.g. a typo like {guest_nme} stays as {guest_nme}). This is the
 * author's cue that a token will not resolve at send time - it deliberately does
 * NOT blank unknown tokens out.
 */
export function renderTemplatePreview(
  text: string,
  values: Record<string, string> = MESSAGE_TEMPLATE_PREVIEW_VALUES,
): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
  );
}

/** Human-readable trigger description for a template row. */
export function formatTriggerLabel(triggerType: string, triggerDays: number | null): string {
  if (triggerType === "on_confirmation") return "On booking confirmation";
  if (triggerType === "days_before_checkin") {
    const n = triggerDays ?? 0;
    return `${n} ${n === 1 ? "day" : "days"} before check-in`;
  }
  return triggerType;
}

/**
 * Form schema for creating/editing a template. trigger_days is held as a string
 * (number input) and is required (>= 1, whole number) only when the trigger is
 * days_before_checkin - mirroring the backend 422 rule so the client rejects the
 * same bad input before it ever hits the API.
 */
export const messageTemplateFormSchema = z
  .object({
    templateKey: z.string().trim().min(1, "Template key is required"),
    // "" means the template applies to all properties (tenant-wide default).
    propertyId: z.string(),
    subjectTemplate: z.string().trim().min(1, "Subject is required"),
    bodyTemplate: z.string().trim().min(1, "Body is required"),
    triggerType: z.enum(["on_confirmation", "days_before_checkin"]),
    triggerDays: z.string(),
    isActive: z.boolean(),
  })
  .refine(
    (v) => {
      if (v.triggerType !== "days_before_checkin") return true;
      const n = Number(v.triggerDays);
      return v.triggerDays.trim() !== "" && Number.isInteger(n) && n >= 1;
    },
    { path: ["triggerDays"], message: "Enter a whole number of days (at least 1)" },
  );

export type MessageTemplateFormData = z.infer<typeof messageTemplateFormSchema>;
