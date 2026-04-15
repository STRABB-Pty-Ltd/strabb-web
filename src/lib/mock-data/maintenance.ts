import type { Maintenance } from "@/types/maintenance";
import { REFERENCE_NOW } from "./reference-date";

const day = (offset: number) => {
  const d = new Date(REFERENCE_NOW);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().split("T")[0];
};

const defaults: Maintenance = {
  id: "mnt-001",
  listingId: "lst-006",
  listingName: "Newtown Terrace",
  description: "Broken shower head in main bathroom",
  priority: "high",
  status: "reported",
  dateReported: day(-2),
  dateScheduled: null,
  notes: "Discovered during turnover clean",
};

export function createMaintenance(
  overrides?: Partial<Maintenance>,
): Maintenance {
  return { ...defaults, ...overrides };
}

export const mockMaintenanceList: Maintenance[] = [
  // reported
  createMaintenance(),
  // scheduled
  createMaintenance({
    id: "mnt-002",
    listingId: "lst-004",
    listingName: "Manly Surf Lodge",
    description: "Dishwasher not draining properly",
    priority: "medium",
    status: "scheduled",
    dateReported: day(-5),
    dateScheduled: day(2),
    notes: "Plumber booked for Tuesday",
  }),
  // in_progress
  createMaintenance({
    id: "mnt-003",
    listingId: "lst-002",
    listingName: "Bondi Beach Apartment — Unit A",
    description: "Air conditioning unit making loud noise",
    priority: "urgent",
    status: "in_progress",
    dateReported: day(-3),
    dateScheduled: day(-1),
    notes: "HVAC tech on site",
  }),
  // completed
  createMaintenance({
    id: "mnt-004",
    listingId: "lst-005",
    listingName: "Coogee Bay Studio",
    description: "Replace smoke detector batteries",
    priority: "high",
    status: "completed",
    dateReported: day(-10),
    dateScheduled: day(-8),
    notes: null,
  }),
  // cancelled
  createMaintenance({
    id: "mnt-005",
    listingId: "lst-007",
    listingName: "Surry Hills Loft",
    description: "Squeaky bedroom door",
    priority: "low",
    status: "cancelled",
    dateReported: day(-7),
    dateScheduled: null,
    notes: "Fixed with WD-40 during cleaning",
  }),
  // reported
  createMaintenance({
    id: "mnt-006",
    listingId: "lst-003",
    listingName: "Bondi Beach Apartment — Unit B",
    description: "Kitchen tap dripping",
    priority: "medium",
    status: "reported",
    dateReported: day(-1),
    dateScheduled: null,
    notes: null,
  }),
  // scheduled
  createMaintenance({
    id: "mnt-007",
    listingId: "lst-004",
    listingName: "Manly Surf Lodge",
    description: "Pool fence panel loose",
    priority: "urgent",
    status: "scheduled",
    dateReported: day(-4),
    dateScheduled: day(1),
    notes: "Compliance issue — must be fixed before next guest",
  }),
  // in_progress
  createMaintenance({
    id: "mnt-008",
    listingId: "lst-006",
    listingName: "Newtown Terrace",
    description: "Repaint hallway wall — scuff marks",
    priority: "low",
    status: "in_progress",
    dateReported: day(-6),
    dateScheduled: day(-2),
    notes: null,
  }),
];
