export interface Financial {
  id: string;
  month: string;
  listingId: string;
  listingName: string;
  revenue: number;
  cleaningCost: number;
  ticketCost: number;
  suppliesCost: number;
  platformFees: number;
  occupancyRate: number;
  avgNightlyRate: number;
  bookingCount: number;
  currency?: string;
}
