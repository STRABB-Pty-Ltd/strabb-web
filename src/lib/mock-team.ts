// Shared mock team data. Used by settings/team-section and the cleaning
// drawer's cleaner picker until a real users/team API lands.

export type TeamRole = "admin" | "manager" | "cleaner" | "viewer";

export interface MockTeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: TeamRole;
  lastLogin: string;
  status: "active" | "invited" | "inactive";
}

export const mockTeamMembers: MockTeamMember[] = [
  {
    id: "u-1",
    name: "Will Flynn",
    email: "will@strabb.com",
    role: "admin",
    lastLogin: "2026-04-14",
    status: "active",
  },
  {
    id: "u-2",
    name: "Chris Taylor",
    email: "chris@strabb.com",
    role: "admin",
    lastLogin: "2026-04-13",
    status: "active",
  },
  {
    id: "u-3",
    name: "Maria Santos",
    email: "maria.s@cleanteam.com",
    phone: "+61 400 111 222",
    role: "cleaner",
    lastLogin: "2026-04-12",
    status: "active",
  },
  {
    id: "u-4",
    name: "Tom Williams",
    email: "tom.w@cleanteam.com",
    phone: "+61 400 333 444",
    role: "cleaner",
    lastLogin: "2026-04-10",
    status: "active",
  },
  {
    id: "u-5",
    name: "Jen Liu",
    email: "jen.l@cleanteam.com",
    phone: "+61 400 555 666",
    role: "cleaner",
    lastLogin: "2026-04-11",
    status: "active",
  },
];

export function getCleaners(): MockTeamMember[] {
  return mockTeamMembers.filter((m) => m.role === "cleaner" && m.status === "active");
}
