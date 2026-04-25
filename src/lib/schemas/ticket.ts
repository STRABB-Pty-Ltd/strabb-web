import { z } from "zod";

import {
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS_OPTIONS,
  type TicketPriority,
  type TicketStatus,
} from "@/types/ticket";

const priorityValues = TICKET_PRIORITY_OPTIONS.map((o) => o.value) as [
  TicketPriority,
  ...TicketPriority[],
];

const statusValues = TICKET_STATUS_OPTIONS.map((o) => o.value) as [TicketStatus, ...TicketStatus[]];

export const ticketCreateSchema = z.object({
  propertyId: z.string().uuid("Select a property"),
  listingId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(5000, "Description must be 5000 characters or fewer"),
  priority: z.enum(priorityValues),
  dateScheduled: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
  cost: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
  notes: z
    .string()
    .max(5000, "Notes must be 5000 characters or fewer")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type TicketCreateFormData = z.infer<typeof ticketCreateSchema>;

export const ticketUpdateSchema = ticketCreateSchema
  .extend({
    status: z.enum(statusValues).optional(),
  })
  .partial();

export type TicketUpdateFormData = z.infer<typeof ticketUpdateSchema>;
