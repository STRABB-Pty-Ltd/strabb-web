import type { Financial } from "@/types/financial";

const now = new Date();
const monthStr = (offset: number) => {
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const defaults: Financial = {
  id: "fin-001",
  month: monthStr(0),
  listingId: "lst-002",
  listingName: "Bondi Beach Apartment — Unit A",
  revenue: 5400,
  cleaningCost: 480,
  maintenanceCost: 150,
  suppliesCost: 85,
  platformFees: 810,
  occupancyRate: 82,
  avgNightlyRate: 180,
  bookingCount: 6,
};

export function createFinancial(overrides?: Partial<Financial>): Financial {
  return { ...defaults, ...overrides };
}

const listings = [
  { id: "lst-002", name: "Bondi Beach Apartment — Unit A", rate: 180 },
  { id: "lst-003", name: "Bondi Beach Apartment — Unit B", rate: 250 },
  { id: "lst-004", name: "Manly Surf Lodge", rate: 450 },
  { id: "lst-005", name: "Coogee Bay Studio", rate: 160 },
  { id: "lst-006", name: "Newtown Terrace", rate: 220 },
  { id: "lst-007", name: "Surry Hills Loft", rate: 195 },
];

let finId = 1;

export const mockFinancialList: Financial[] = Array.from(
  { length: 6 },
  (_, monthIdx) => {
    const month = monthStr(-5 + monthIdx);
    return listings.map((listing) => {
      const seasonMultiplier = monthIdx >= 3 ? 1.15 : 0.9;
      const occupancy = Math.round(60 + Math.random() * 30 * seasonMultiplier);
      const bookings = Math.max(3, Math.round(occupancy / 15));
      const revenue = Math.round(
        listing.rate * (occupancy / 100) * 30 * seasonMultiplier,
      );
      return createFinancial({
        id: `fin-${String(finId++).padStart(3, "0")}`,
        month,
        listingId: listing.id,
        listingName: listing.name,
        revenue,
        cleaningCost: Math.round(revenue * 0.08),
        maintenanceCost: Math.round(revenue * 0.03),
        suppliesCost: Math.round(revenue * 0.015),
        platformFees: Math.round(revenue * 0.15),
        occupancyRate: occupancy,
        avgNightlyRate: listing.rate,
        bookingCount: bookings,
      });
    });
  },
).flat();
