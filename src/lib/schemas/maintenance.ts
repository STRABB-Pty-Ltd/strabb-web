import { z } from "zod";

import {
  MAINTENANCE_PRIORITY_OPTIONS,
  MAINTENANCE_STATUS_OPTIONS,
  type MaintenancePriority,
  type MaintenanceStatus,
} from "@/types/maintenance";

const priorityValues = MAINTENANCE_PRIORITY_OPTIONS.map((o) => o.value) as [
  MaintenancePriority,
  ...MaintenancePriority[],
];

const statusValues = MAINTENANCE_STATUS_OPTIONS.map((o) => o.value) as [
  MaintenanceStatus,
  ...MaintenanceStatus[],
];

export const maintenanceCreateSchema = z.object({
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

export type MaintenanceCreateFormData = z.infer<typeof maintenanceCreateSchema>;

export const maintenanceUpdateSchema = maintenanceCreateSchema
  .extend({
    status: z.enum(statusValues).optional(),
  })
  .partial();

export type MaintenanceUpdateFormData = z.infer<typeof maintenanceUpdateSchema>;
