"use client";

import { useAuthenticatedQuery } from "./use-authenticated-query";
import { keysToCamel } from "@/lib/case-utils";
import type { Invite, TeamMember, TeamRole } from "@/lib/schemas/team";

// Shared query keys - the team-api mutations invalidate these on success.
export const TEAM_USERS_KEY = ["team", "users"];
export const TEAM_INVITES_KEY = ["team", "invites"];

// GET /users and GET /invites return the standard { data: [...] } list
// envelope (same shape as /admin/* and /conversations). Keeping the envelope
// type mirrors use-admin; components read `.data`.
interface ListEnvelope<T> {
  data: T[];
}

interface UseTeamMembersOptions {
  role?: TeamRole;
  includeInactive?: boolean;
  enabled?: boolean;
}

export function useTeamMembers({ role, includeInactive, enabled }: UseTeamMembersOptions = {}) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (includeInactive) params.set("include_inactive", "true");
  const qs = params.toString();

  return useAuthenticatedQuery<ListEnvelope<TeamMember>>(
    ["team", "users", role ?? "all", includeInactive ? "all-status" : "active"],
    `/users${qs ? `?${qs}` : ""}`,
    { select: (raw) => keysToCamel<ListEnvelope<TeamMember>>(raw), enabled },
  );
}

export function useInvites(options?: { enabled?: boolean }) {
  return useAuthenticatedQuery<ListEnvelope<Invite>>(TEAM_INVITES_KEY, "/invites", {
    select: (raw) => keysToCamel<ListEnvelope<Invite>>(raw),
    enabled: options?.enabled,
  });
}
