"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TEAM_INVITES_KEY, TEAM_USERS_KEY } from "@/hooks/use-team";
import { useApiClient } from "@/hooks/use-api-client";
import type { InviteFormData, TeamRole } from "@/lib/schemas/team";

/**
 * Team lifecycle mutations for the settings > Team section. Queries live in
 * hooks/use-team.ts; these mutations invalidate those keys so the members and
 * pending-invites tables refresh (e.g. an invitee accepting moves from Pending
 * to Members without a page rebuild). Errors are surfaced by the caller so the
 * last-owner 409 lands as a toast.
 */

export function useCreateInvite() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteFormData) => apiClient.post("/invites", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_INVITES_KEY });
    },
  });
}

export function useRevokeInvite() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/invites/${id}/revoke`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_INVITES_KEY });
    },
  });
}

export function useResendInvite() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/invites/${id}/resend`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_INVITES_KEY });
    },
  });
}

export function useUpdateUserRole() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: TeamRole }) =>
      apiClient.patch(`/users/${id}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_USERS_KEY });
    },
  });
}

// Same PATCH /users/{id} endpoint as the role change, carrying the cleaner pay
// rate. The client keysToSnake-converts hourlyRate -> hourly_rate, which is what
// the api's UserRoleUpdateRequest expects (owner/admin-only, ge=0).
export function useUpdateUserHourlyRate() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hourlyRate }: { id: string; hourlyRate: number }) =>
      apiClient.patch(`/users/${id}`, { hourlyRate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_USERS_KEY });
    },
  });
}

export function useDeactivateUser() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/users/${id}/deactivate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_USERS_KEY });
    },
  });
}

export function useReactivateUser() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/users/${id}/reactivate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_USERS_KEY });
    },
  });
}
