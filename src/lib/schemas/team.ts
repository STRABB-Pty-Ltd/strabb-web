import { z } from "zod";

/**
 * The REAL role vocabulary the API speaks. The retired mock team fixture used
 * `admin | manager | cleaner | viewer`; `manager` and `viewer` never existed
 * on the backend. Owner/admin/cleaner is the whole set (see the Phase B role
 * matrix). Order is the order shown in the invite role picker.
 */
export const TEAM_ROLES = ["owner", "admin", "cleaner"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  cleaner: "Cleaner",
};

export const TEAM_ROLE_OPTIONS = TEAM_ROLES.map((value) => ({
  value,
  label: TEAM_ROLE_LABELS[value],
}));

/** A team member as returned by GET /users (after keysToCamel). */
export interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: TeamRole;
  isActive: boolean;
  lastLoginAt: string | null;
}

/** A pending invite as returned by GET /invites (after keysToCamel). */
export interface Invite {
  id: string;
  email: string;
  role: TeamRole;
  expiresAt: string;
  createdAt?: string | null;
  invitedByUserId?: string | null;
}

/** Payload for POST /invites - what the invite modal submits. */
export const inviteFormSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(TEAM_ROLES),
});

export type InviteFormData = z.infer<typeof inviteFormSchema>;
