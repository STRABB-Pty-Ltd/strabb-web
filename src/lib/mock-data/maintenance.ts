import type { Maintenance } from "@/types/maintenance";
import { REFERENCE_NOW } from "./reference-date";

const day = (offset: number) => {
  const d = new Date(REFERENCE_NOW);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().split("T")[0];
};

const NOW = new Date(REFERENCE_NOW).toISOString();

const defaults: Maintenance = {
  id: "mnt-001",
  propertyId: "prp-001",
  listingId: "lst-006",
  description: "Broken shower head in main bathroom",
  priority: "high",
  status: "reported",
  dateReported: day(-2),
  dateScheduled: null,
  dateCompleted: null,
  cost: null,
  notes: "Discovered during turnover clean",
  createdAt: NOW,
  updatedAt: NOW,
};

export function createMaintenance(overrides?: Partial<Maintenance>): Maintenance {
  return { ...defaults, ...overrides };
}

export const mockMaintenanceList: Maintenance[] = [
  createMaintenance(),
  createMaintenance({
    id: "mnt-002",
    propertyId: "prp-002",
    listingId: "lst-004",
    description: "Dishwasher not draining properly",
    priority: "medium",
    status: "scheduled",
    dateReported: day(-5),
    dateScheduled: day(2),
    notes: "Plumber booked for Tuesday",
  }),
  createMaintenance({
    id: "mnt-003",
    propertyId: "prp-003",
    listingId: "lst-002",
    description: "Air conditioning unit making loud noise",
    priority: "urgent",
    status: "in_progress",
    dateReported: day(-3),
    dateScheduled: day(-1),
    notes: "HVAC tech on site",
  }),
  createMaintenance({
    id: "mnt-004",
    propertyId: "prp-004",
    listingId: "lst-005",
    description: "Replace smoke detector batteries",
    priority: "high",
    status: "completed",
    dateReported: day(-10),
    dateScheduled: day(-8),
    dateCompleted: day(-7),
    cost: "45.00",
    notes: null,
  }),
  createMaintenance({
    id: "mnt-005",
    propertyId: "prp-005",
    listingId: "lst-007",
    description: "Squeaky bedroom door",
    priority: "low",
    status: "cancelled",
    dateReported: day(-7),
    dateScheduled: null,
    notes: "Fixed with WD-40 during cleaning",
  }),
  createMaintenance({
    id: "mnt-006",
    propertyId: "prp-002",
    listingId: "lst-003",
    description: "Kitchen tap dripping",
    priority: "medium",
    status: "reported",
    dateReported: day(-1),
    dateScheduled: null,
    notes: null,
  }),
  createMaintenance({
    id: "mnt-007",
    propertyId: "prp-002",
    listingId: "lst-004",
    description: "Pool fence panel loose",
    priority: "urgent",
    status: "scheduled",
    dateReported: day(-4),
    dateScheduled: day(1),
    notes: "Compliance issue — must be fixed before next guest",
  }),
  createMaintenance({
    id: "mnt-008",
    propertyId: "prp-001",
    listingId: "lst-006",
    description: "Repaint hallway wall — scuff marks",
    priority: "low",
    status: "in_progress",
    dateReported: day(-6),
    dateScheduled: day(-2),
    notes: null,
  }),
];
