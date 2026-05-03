import type { Ticket } from "@/types/ticket";
import { REFERENCE_NOW } from "./reference-date";

const day = (offset: number) => {
  const d = new Date(REFERENCE_NOW);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().split("T")[0];
};

const NOW = new Date(REFERENCE_NOW).toISOString();

const defaults: Ticket = {
  id: "tkt-001",
  propertyId: "prp-001",
  listingId: "lst-006",
  description: "Broken shower head in main bathroom",
  priority: "high",
  status: "pending",
  dateReported: day(-2),
  dateScheduled: null,
  dateCompleted: null,
  cost: null,
  notes: "Discovered during turnover clean",
  createdAt: NOW,
  updatedAt: NOW,
};

export function createTicket(overrides?: Partial<Ticket>): Ticket {
  return { ...defaults, ...overrides };
}

export const mockTicketsList: Ticket[] = [
  createTicket(),
  createTicket({
    id: "tkt-002",
    propertyId: "prp-002",
    listingId: "lst-004",
    description: "Dishwasher not draining properly",
    priority: "medium",
    status: "confirmed",
    dateReported: day(-5),
    dateScheduled: day(2),
    notes: "Plumber booked for Tuesday",
  }),
  createTicket({
    id: "tkt-003",
    propertyId: "prp-003",
    listingId: "lst-002",
    description: "Air conditioning unit making loud noise",
    priority: "urgent",
    status: "in_progress",
    dateReported: day(-3),
    dateScheduled: day(-1),
    notes: "HVAC tech on site",
  }),
  createTicket({
    id: "tkt-004",
    propertyId: "prp-004",
    listingId: "lst-005",
    description: "Replace smoke detector batteries",
    priority: "high",
    status: "completed",
    dateReported: day(-10),
    dateScheduled: day(-8),
    dateCompleted: day(-7),
    cost: 45,
    notes: null,
  }),
  createTicket({
    id: "tkt-005",
    propertyId: "prp-005",
    listingId: "lst-007",
    description: "Squeaky bedroom door",
    priority: "low",
    status: "completed",
    dateReported: day(-7),
    dateScheduled: null,
    notes: "Fixed with WD-40 during cleaning",
  }),
  createTicket({
    id: "tkt-006",
    propertyId: "prp-002",
    listingId: "lst-003",
    description: "Kitchen tap dripping",
    priority: "medium",
    status: "pending",
    dateReported: day(-1),
    dateScheduled: null,
    notes: null,
  }),
  createTicket({
    id: "tkt-007",
    propertyId: "prp-002",
    listingId: "lst-004",
    description: "Pool fence panel loose",
    priority: "urgent",
    status: "confirmed",
    dateReported: day(-4),
    dateScheduled: day(1),
    notes: "Compliance issue - must be fixed before next guest",
  }),
  createTicket({
    id: "tkt-008",
    propertyId: "prp-001",
    listingId: "lst-006",
    description: "Repaint hallway wall - scuff marks",
    priority: "low",
    status: "cancelled",
    dateReported: day(-6),
    dateScheduled: day(-2),
    notes: "Decided to leave until end-of-season refresh",
  }),
];
