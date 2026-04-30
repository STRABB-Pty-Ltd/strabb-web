"use client";

import { useListings } from "./use-listings";
import { useProperties } from "./use-properties";

export const DEFAULT_TIMEZONE = "Australia/Sydney";

export function usePropertyTimezone(propertyId: string | null | undefined): string {
  const { data } = useProperties();
  if (!propertyId) return DEFAULT_TIMEZONE;
  const property = data?.data.find((p) => p.id === propertyId);
  return property?.timezone ?? DEFAULT_TIMEZONE;
}

export function useTimezoneForListing(listingId: string | null | undefined): string {
  const { data: listingsData } = useListings();
  const { data: propertiesData } = useProperties();
  if (!listingId) return DEFAULT_TIMEZONE;
  const listing = listingsData?.data.find((l) => l.id === listingId);
  if (!listing) return DEFAULT_TIMEZONE;
  const property = propertiesData?.data.find((p) => p.id === listing.propertyId);
  return property?.timezone ?? DEFAULT_TIMEZONE;
}
