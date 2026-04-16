export interface Financial {
  id: string;
  month: string;
  listingId: string;
  listingName: string;
  revenue: number;
  cleaningCost: number;
  maintenanceCost: number;
  suppliesCost: number;
  platformFees: number;
  occupancyRate: number;
  avgNightlyRate: number;
  bookingCount: number;
}
