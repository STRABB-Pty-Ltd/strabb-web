import { z } from "zod";

/**
 * Cleaner-portal types (Phase D1). These mirror the api PortalTaskResponse,
 * which deliberately EXCLUDES every financial and PII field a cleaner must not
 * see: no cost/currency, no cleaner_name/email/phone, no booking_id, no
 * linked_ticket_id. The portal UI has no slot for money; server-side the
 * PortalTaskResponse schema is the real enforcement (a CLEANER JWT can never
 * retrieve those keys). All shapes here are camelCase (post keysToCamel).
 */

// Full cleaning-task status set after Phase D. `accepted` + `in_progress` are
// the two statuses a cleaner can drive a task into from the portal; the machine
// is pending/confirmed -> accepted -> in_progress -> completed.
export type PortalTaskStatus =
  | "pending"
  | "confirmed"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

export const PORTAL_TASK_STATUSES: readonly PortalTaskStatus[] = [
  "pending",
  "confirmed",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
] as const;

// Chip label per status, from a cleaner's point of view (they see tasks
// assigned to them, so "pending"/"confirmed" read as scheduled work).
export const PORTAL_STATUS_LABELS: Record<PortalTaskStatus, string> = {
  pending: "Pending",
  confirmed: "Scheduled",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Chip tone per status. Reuses the shared semantic status tokens so the portal
// reads the same as the owner-side ops board (accepted = amber/in-the-pipeline,
// in_progress/completed = green, pending = red, cancelled = dim).
export const PORTAL_STATUS_COLORS: Record<PortalTaskStatus, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  accepted: "var(--status-accepted)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

export interface PortalTask {
  id: string;
  listingId: string;
  listingName: string | null;
  propertyId: string;
  taskType: string;
  priority: string;
  status: PortalTaskStatus;
  scheduledDate: string | null;
  scheduledTime: string | null;
  estimatedHours: number;
  actualHours: number | null;
  checklistTotal: number;
  checklistDone: number;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// The three time buckets the list endpoint filters on.
export type PortalWindow = "today" | "upcoming" | "past";

// Portal state machine transitions. `accept` moves confirmed/pending -> accepted,
// `start` -> in_progress, `complete` -> completed (stamps actual_hours +
// completed_at). An illegal transition is a 409 from the api.
export type TransitionAction = "accept" | "start" | "complete";

export interface TransitionInput {
  action: TransitionAction;
  actualHours?: number;
  notes?: string;
}

// Optimistic target status for a given action, used for the optimistic write
// before the api confirms. A 409 rolls the cache back to the prior value.
export const TRANSITION_TARGET_STATUS: Record<TransitionAction, PortalTaskStatus> = {
  accept: "accepted",
  start: "in_progress",
  complete: "completed",
};

// Which action (if any) is offered next for a task in a given status. Terminal
// states (completed, cancelled) offer nothing.
export function nextActionForStatus(status: PortalTaskStatus): TransitionAction | null {
  switch (status) {
    case "pending":
    case "confirmed":
      return "accept";
    case "accepted":
      return "start";
    case "in_progress":
      return "complete";
    default:
      return null;
  }
}

// ---- Availability (D1.2) ----

// A weekly recurring availability window. weekday is 0-6 (Mon-Sun by api
// convention); times are "HH:MM" (or "HH:MM:SS"). Multiple rows per weekday are
// allowed (split shifts). user_id is derived server-side on the self-only
// portal endpoints, so the web never sends it.
export interface WeeklyAvailability {
  id?: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface TimeOff {
  id: string;
  startAt: string;
  endAt: string;
  note: string | null;
}

export interface AvailabilityResponse {
  weekly: WeeklyAvailability[];
  timeOff: TimeOff[];
}

export const WEEKDAY_LABELS: readonly string[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Form schema for a single weekly window. end must be after start.
export const weeklyWindowSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Enter a valid time"),
    endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Enter a valid time"),
  })
  .refine((w) => w.endTime > w.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type WeeklyWindowInput = z.infer<typeof weeklyWindowSchema>;

// Form schema for adding a block of time off. end must be after start.
export const timeOffSchema = z
  .object({
    startAt: z.string().min(1, "Start is required"),
    endAt: z.string().min(1, "End is required"),
    note: z.string().max(500).optional(),
  })
  .refine((t) => new Date(t.endAt) > new Date(t.startAt), {
    message: "End must be after start",
    path: ["endAt"],
  });

export type TimeOffInput = z.infer<typeof timeOffSchema>;
