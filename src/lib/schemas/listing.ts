import { z } from "zod";

export const PLATFORM_OPTIONS = [
  { value: "airbnb", label: "Airbnb" },
  { value: "booking_com", label: "Booking.com" },
  { value: "stayz", label: "Stayz" },
  { value: "vrbo", label: "VRBO" },
  { value: "direct", label: "Direct" },
  { value: "other", label: "Other" },
] as const;

export const listingCreateSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  name: z.string().min(1, "Name is required").max(255),
  platform: z.string().min(1, "Platform is required"),
  externalListingId: z.string().max(255).optional().or(z.literal("")),
  icalFeedUrl: z.string().max(1000).url("Must be a valid URL").optional().or(z.literal("")),
});

export type ListingCreateFormData = z.infer<typeof listingCreateSchema>;

export const listingUpdateSchema = listingCreateSchema.omit({ propertyId: true }).partial();

export type ListingUpdateFormData = z.infer<typeof listingUpdateSchema>;

export type ListingType = "parent" | "child" | "standalone";

export interface ListingResponse {
  id: string;
  propertyId: string;
  name: string;
  platform: string;
  externalListingId: string | null;
  icalFeedUrl: string | null;
  syncStatus: string;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  isActive: boolean;
  listingType: ListingType;
  parentId: string | null;
  nightlyRate: number | null;
  channexPropertyId: string | null;
  channexRoomTypeId: string | null;
  channexRatePlanId: string | null;
  children: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListingListResponse {
  data: ListingResponse[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ChannelListingSummary {
  id: string;
  name: string;
  syncStatus: string;
}

/** One row per OTA/channel from `GET /listings/channels` (backs A.9). */
export interface ChannelSummaryResponse {
  id: string;
  name: string;
  status: "connected" | "pending" | "error" | "not_connected";
  listingCount: number;
  mappedListings: ChannelListingSummary[];
}
