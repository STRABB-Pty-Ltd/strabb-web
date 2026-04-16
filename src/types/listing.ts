export type ListingRelationship = "parent" | "child" | "standalone";

export interface Listing {
  id: string;
  name: string;
  relationship: ListingRelationship;
  parentId: string | null;
  children: string[];
  color: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  nightlyRate: number;
  location: string;
  propertyId: string;
  isActive: boolean;
}
