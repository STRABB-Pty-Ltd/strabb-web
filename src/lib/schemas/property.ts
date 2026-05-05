import { z } from "zod";

const isValidTimezone = (tz: string): boolean => {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

export const propertyCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  address: z.string().max(500).optional().or(z.literal("")),
  timezone: z
    .string()
    .min(1, "Timezone is required")
    .max(100)
    .refine(isValidTimezone, "Invalid timezone"),
  cleaningDurationMinutes: z.coerce
    .number()
    .int()
    .min(0, "Must be 0 or more")
    .max(1440, "Must be 24 hours or less")
    .default(120),
  accessInstructions: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  cleanerName: z.string().max(255).optional().or(z.literal("")),
  cleanerEmail: z.string().max(255).optional().or(z.literal("")),
  cleanerPhone: z.string().max(50).optional().or(z.literal("")),
});

export type PropertyCreateFormData = z.infer<typeof propertyCreateSchema>;

export const propertyUpdateSchema = propertyCreateSchema.partial();

export type PropertyUpdateFormData = z.infer<typeof propertyUpdateSchema>;

export interface PropertyResponse {
  id: string;
  name: string;
  address: string | null;
  timezone: string;
  cleaningDurationMinutes: number;
  accessInstructions: string | null;
  notes: string | null;
  cleanerName: string | null;
  cleanerEmail: string | null;
  cleanerPhone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyListResponse {
  data: PropertyResponse[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
