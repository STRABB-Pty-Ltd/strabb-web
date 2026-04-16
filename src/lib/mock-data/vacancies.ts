import type { Vacancy } from "@/types/vacancy";
import { REFERENCE_NOW } from "./reference-date";

const day = (offset: number) => {
  const d = new Date(REFERENCE_NOW);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().split("T")[0];
};

const defaults: Vacancy = {
  id: "vac-001",
  listingId: "lst-002",
  listingName: "Bondi Beach Apartment — Unit A",
  startDate: day(2),
  endDate: day(5),
  gapDays: 3,
};

export function createVacancy(overrides?: Partial<Vacancy>): Vacancy {
  return { ...defaults, ...overrides };
}

export const mockVacancyList: Vacancy[] = [
  createVacancy(),
  createVacancy({
    id: "vac-002",
    listingId: "lst-003",
    listingName: "Bondi Beach Apartment — Unit B",
    startDate: day(10),
    endDate: day(15),
    gapDays: 5,
  }),
  createVacancy({
    id: "vac-003",
    listingId: "lst-005",
    listingName: "Coogee Bay Studio",
    startDate: day(-5),
    endDate: day(-1),
    gapDays: 4,
  }),
  createVacancy({
    id: "vac-004",
    listingId: "lst-006",
    listingName: "Newtown Terrace",
    startDate: day(12),
    endDate: day(20),
    gapDays: 8,
  }),
  createVacancy({
    id: "vac-005",
    listingId: "lst-007",
    listingName: "Surry Hills Loft",
    startDate: day(6),
    endDate: day(9),
    gapDays: 3,
  }),
  createVacancy({
    id: "vac-006",
    listingId: "lst-004",
    listingName: "Manly Surf Lodge",
    startDate: day(17),
    endDate: day(22),
    gapDays: 5,
  }),
  createVacancy({
    id: "vac-007",
    listingId: "lst-002",
    listingName: "Bondi Beach Apartment — Unit A",
    startDate: day(25),
    endDate: day(30),
    gapDays: 5,
  }),
];
