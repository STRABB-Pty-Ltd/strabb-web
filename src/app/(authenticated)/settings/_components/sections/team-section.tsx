"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useInvites, useTeamMembers } from "@/hooks/use-team";
import {
  useCreateInvite,
  useDeactivateUser,
  useReactivateUser,
  useResendInvite,
  useRevokeInvite,
  useUpdateUserHourlyRate,
  useUpdateUserRole,
} from "@/lib/api-hooks/team-api";
import { ApiError } from "@/lib/api-client";
import {
  inviteFormSchema,
  TEAM_ROLE_LABELS,
  TEAM_ROLE_OPTIONS,
  type TeamMember,
  type TeamRole,
} from "@/lib/schemas/team";
import { useAppStore } from "@/stores/app-store";

const roleBadgeColors: Record<TeamRole, { bg: string; text: string }> = {
  owner: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
  admin: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
  cleaner: { bg: "var(--neutral-30)", text: "var(--status-success)" },
};

const statusColors: Record<string, string> = {
  active: "var(--status-success)",
  inactive: "var(--highlight-10)",
};

const headerCellClass =
  "px-sm py-sm text-body text-highlight-10 text-left font-semibold tracking-wide uppercase whitespace-nowrap";

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return format(new Date(value), "d MMM yyyy");
}

// The API detail (e.g. the last-owner 409 message) is worth surfacing verbatim;
// fall back to a friendly generic for anything that is not a structured error.
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError && err.message ? err.message : fallback;
}

// Editable AUD/hour cell for a cleaner. Local draft state so typing does not
// fire a request per keystroke; commits on blur (and Enter) when the value is a
// valid non-negative number that actually changed. Kept as its own component so
// each row owns its draft and re-syncs when the server value changes.
function HourlyRateCell({
  member,
  onSave,
  saving,
}: {
  member: TeamMember;
  onSave: (id: string, hourlyRate: number) => void;
  saving: boolean;
}) {
  const initial = member.hourlyRate != null ? String(member.hourlyRate) : "";
  const [value, setValue] = useState(initial);
  const [error, setError] = useState(false);

  useEffect(() => {
    setValue(member.hourlyRate != null ? String(member.hourlyRate) : "");
  }, [member.hourlyRate]);

  const commit = () => {
    const trimmed = value.trim();
    // Empty = leave as-is; there is no "clear the rate" path at launch.
    if (trimmed === "") {
      setError(false);
      return;
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num < 0) {
      setError(true);
      return;
    }
    setError(false);
    if (num === (member.hourlyRate ?? null)) return;
    onSave(member.id, num);
  };

  return (
    <div className="gap-xs flex items-center">
      <span className="text-highlight-10" aria-hidden="true">
        $
      </span>
      <Input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        aria-label={`Hourly rate for ${member.fullName}`}
        aria-invalid={error}
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        placeholder="0.00"
        className="w-24"
      />
    </div>
  );
}

export function TeamSection() {
  const addToast = useAppStore((s) => s.addToast);

  const membersQuery = useTeamMembers({ includeInactive: true });
  const invitesQuery = useInvites();
  const members = membersQuery.data?.data ?? [];
  const invites = invitesQuery.data?.data ?? [];

  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();
  const resendInvite = useResendInvite();
  const updateRole = useUpdateUserRole();
  const updateRate = useUpdateUserHourlyRate();
  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("cleaner");
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleInvite = () => {
    const parsed = inviteFormSchema.safeParse({ email: inviteEmail.trim(), role: inviteRole });
    if (!parsed.success) {
      setInviteError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    setInviteError(null);
    createInvite.mutate(parsed.data, {
      onSuccess: () => {
        addToast({ type: "success", message: `Invitation sent to ${parsed.data.email}` });
        setInviteEmail("");
        setInviteRole("cleaner");
        setShowInvite(false);
      },
      onError: (err) =>
        addToast({ type: "error", message: errorMessage(err, "Failed to send invitation") }),
    });
  };

  const handleRoleChange = (id: string, role: TeamRole) => {
    updateRole.mutate(
      { id, role },
      {
        onSuccess: () => addToast({ type: "success", message: "Role updated" }),
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to update role") }),
      },
    );
  };

  const handleRateChange = (id: string, hourlyRate: number) => {
    updateRate.mutate(
      { id, hourlyRate },
      {
        onSuccess: () => addToast({ type: "success", message: "Hourly rate updated" }),
        onError: (err) =>
          addToast({ type: "error", message: errorMessage(err, "Failed to update hourly rate") }),
      },
    );
  };

  const handleDeactivate = (id: string) => {
    deactivate.mutate(id, {
      onSuccess: () => addToast({ type: "success", message: "Member deactivated" }),
      onError: (err) =>
        addToast({ type: "error", message: errorMessage(err, "Failed to deactivate member") }),
    });
  };

  const handleReactivate = (id: string) => {
    reactivate.mutate(id, {
      onSuccess: () => addToast({ type: "success", message: "Member reactivated" }),
      onError: (err) =>
        addToast({ type: "error", message: errorMessage(err, "Failed to reactivate member") }),
    });
  };

  const handleResend = (id: string, email: string) => {
    resendInvite.mutate(id, {
      onSuccess: () => addToast({ type: "success", message: `Invitation resent to ${email}` }),
      onError: (err) =>
        addToast({ type: "error", message: errorMessage(err, "Failed to resend invitation") }),
    });
  };

  const handleRevoke = (id: string) => {
    revokeInvite.mutate(id, {
      onSuccess: () => addToast({ type: "success", message: "Invitation revoked" }),
      onError: (err) =>
        addToast({ type: "error", message: errorMessage(err, "Failed to revoke invitation") }),
    });
  };

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-subheading text-highlight-10 font-semibold">Team</h2>
          <p className="text-body text-highlight-10">Manage team members and roles.</p>
        </div>
        <Button type="button" onClick={() => setShowInvite(true)}>
          <Plus size={16} aria-hidden="true" />
          Invite Member
        </Button>
      </div>

      {showInvite && (
        <div
          className="gap-sm p-sm bg-neutral-30 flex items-end rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex-1">
            <label
              htmlFor="team-invite-email"
              className="mb-xs text-body text-highlight-10 block font-medium"
            >
              Email
            </label>
            <Input
              id="team-invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoComplete="email"
              placeholder="email@example.com"
            />
            {inviteError && <p className="text-destructive text-body mt-xs">{inviteError}</p>}
          </div>
          <div>
            <label
              htmlFor="team-invite-role"
              className="mb-xs text-body text-highlight-10 block font-medium"
            >
              Role
            </label>
            <Select
              id="team-invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as TeamRole)}
              options={TEAM_ROLE_OPTIONS}
            />
          </div>
          <Button type="button" onClick={handleInvite} disabled={createInvite.isPending}>
            {createInvite.isPending ? "Sending…" : "Send Invite"}
          </Button>
          <Button
            type="button"
            variant="quiet"
            size="icon"
            onClick={() => {
              setShowInvite(false);
              setInviteError(null);
            }}
            aria-label="Cancel invitation"
          >
            <X size={16} />
          </Button>
        </div>
      )}

      {membersQuery.isLoading ? (
        <p className="text-body text-highlight-10">Loading team...</p>
      ) : members.length === 0 ? (
        <p className="text-body text-highlight-10">
          No team members yet. Invite someone to get started.
        </p>
      ) : (
        <div
          className="w-fit max-w-full overflow-x-auto rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          <table className="text-body">
            <thead>
              <tr className="bg-neutral-30 border-b" style={{ borderColor: "var(--border)" }}>
                <th scope="col" className={headerCellClass}>
                  Name
                </th>
                <th scope="col" className={headerCellClass}>
                  Role
                </th>
                <th scope="col" className={headerCellClass}>
                  Rate (/hr)
                </th>
                <th scope="col" className={headerCellClass}>
                  Email
                </th>
                <th scope="col" className={headerCellClass}>
                  Last Login
                </th>
                <th scope="col" className={headerCellClass}>
                  Status
                </th>
                <th scope="col" className={headerCellClass}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const badge = roleBadgeColors[member.role] ?? roleBadgeColors.cleaner;
                const status = member.isActive ? "active" : "inactive";
                return (
                  <tr
                    key={member.id}
                    className="border-b last:border-b-0"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-sm py-sm text-highlight-10 font-medium whitespace-nowrap">
                      {member.fullName}
                    </td>
                    <td className="px-sm py-sm whitespace-nowrap">
                      <Select
                        aria-label={`Role for ${member.fullName}`}
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as TeamRole)}
                        disabled={updateRole.isPending}
                        options={TEAM_ROLE_OPTIONS}
                        // Badge colours are a per-role runtime lookup, kept inline.
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      />
                    </td>
                    <td className="px-sm py-sm whitespace-nowrap">
                      {member.role === "cleaner" ? (
                        <HourlyRateCell
                          member={member}
                          onSave={handleRateChange}
                          saving={updateRate.isPending}
                        />
                      ) : (
                        <span className="text-highlight-10">-</span>
                      )}
                    </td>
                    <td className="px-sm py-sm text-highlight-10 whitespace-nowrap">
                      {member.email}
                    </td>
                    <td className="px-sm py-sm text-highlight-10 whitespace-nowrap">
                      {formatDate(member.lastLoginAt)}
                    </td>
                    <td className="px-sm py-sm whitespace-nowrap">
                      <span
                        className="gap-xs flex items-center"
                        style={{ color: statusColors[status] }}
                      >
                        <span
                          className="h-xs w-xs rounded-full"
                          style={{ backgroundColor: statusColors[status] }}
                        />
                        {status}
                      </span>
                    </td>
                    <td className="px-sm py-sm whitespace-nowrap">
                      {member.isActive ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => handleDeactivate(member.id)}
                          disabled={deactivate.isPending}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => handleReactivate(member.id)}
                          disabled={reactivate.isPending}
                        >
                          Reactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {invites.length > 0 && (
        <div className="space-y-sm">
          <h3 className="text-body text-highlight-10 font-semibold">Pending invitations</h3>
          <div
            className="w-fit max-w-full overflow-x-auto rounded-lg border"
            style={{ borderColor: "var(--border)" }}
          >
            <table className="text-body">
              <thead>
                <tr className="bg-neutral-30 border-b" style={{ borderColor: "var(--border)" }}>
                  <th scope="col" className={headerCellClass}>
                    Email
                  </th>
                  <th scope="col" className={headerCellClass}>
                    Role
                  </th>
                  <th scope="col" className={headerCellClass}>
                    Expires
                  </th>
                  <th scope="col" className={headerCellClass}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr
                    key={invite.id}
                    className="border-b last:border-b-0"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-sm py-sm text-highlight-10 font-medium whitespace-nowrap">
                      {invite.email}
                    </td>
                    <td className="px-sm py-sm text-highlight-10 whitespace-nowrap capitalize">
                      {TEAM_ROLE_LABELS[invite.role] ?? invite.role}
                    </td>
                    <td className="px-sm py-sm text-highlight-10 whitespace-nowrap">
                      {formatDate(invite.expiresAt)}
                    </td>
                    <td className="px-sm py-sm gap-base flex whitespace-nowrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleResend(invite.id, invite.email)}
                        disabled={resendInvite.isPending}
                      >
                        Resend
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleRevoke(invite.id)}
                        disabled={revokeInvite.isPending}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
