"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { mockTeamMembers } from "@/lib/mock-team";
import { useAppStore } from "@/stores/app-store";

const roleBadgeColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
  manager: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
  cleaner: { bg: "var(--neutral-30)", text: "var(--status-success)" },
  viewer: { bg: "var(--neutral-30)", text: "var(--highlight-10)" },
};

const statusColors: Record<string, string> = {
  active: "var(--status-success)",
  invited: "var(--status-danger)",
  inactive: "var(--highlight-10)",
};

const headerCellClass =
  "px-sm py-sm text-body text-highlight-10 text-left font-semibold tracking-wide uppercase whitespace-nowrap";

export function TeamSection() {
  const addToast = useAppStore((s) => s.addToast);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    addToast({
      type: "success",
      message: `Invitation sent to ${inviteEmail}`,
    });
    setInviteEmail("");
    setShowInvite(false);
  };

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-subheading text-highlight-10 font-semibold">Team</h2>
          <p className="text-body text-highlight-10">Manage team members and roles.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="gap-xs px-sm py-base text-body text-surface-60 flex items-center rounded-lg font-medium"
          style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
        >
          <Plus size={16} aria-hidden="true" />
          Invite Member
        </button>
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
            <input
              id="team-invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoComplete="email"
              className="px-sm py-base text-body bg-surface-60 w-full rounded-sm border"
              style={{ borderColor: "var(--border)" }}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="team-invite-role"
              className="mb-xs text-body text-highlight-10 block font-medium"
            >
              Role
            </label>
            <select
              id="team-invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-sm py-base text-body bg-surface-60 rounded-sm border"
              style={{ borderColor: "var(--border)" }}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cleaner">Cleaner</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleInvite}
            className="px-sm py-base text-body text-surface-60 rounded-lg font-medium"
            style={{ backgroundColor: "var(--highlight-10)", color: "var(--surface-60)" }}
          >
            Send Invite
          </button>
          <button
            type="button"
            onClick={() => setShowInvite(false)}
            aria-label="Cancel invitation"
            className="p-base text-highlight-10 hover:text-highlight-10 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      )}

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
                Email
              </th>
              <th scope="col" className={headerCellClass}>
                Phone
              </th>
              <th scope="col" className={headerCellClass}>
                Last Login
              </th>
              <th scope="col" className={headerCellClass}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {mockTeamMembers.map((member) => {
              const badge = roleBadgeColors[member.role] ?? roleBadgeColors.viewer;
              return (
                <tr
                  key={member.id}
                  className="border-b last:border-b-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-sm py-sm text-highlight-10 font-medium whitespace-nowrap">
                    {member.name}
                  </td>
                  <td className="px-sm py-sm whitespace-nowrap">
                    <span
                      className="px-base py-xs text-body rounded-md font-medium capitalize"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-sm py-sm text-highlight-10 whitespace-nowrap">
                    {member.email}
                  </td>
                  <td className="px-sm py-sm text-highlight-10 whitespace-nowrap">
                    {member.phone ?? ""}
                  </td>
                  <td className="px-sm py-sm text-highlight-10 whitespace-nowrap">
                    {member.lastLogin}
                  </td>
                  <td className="px-sm py-sm whitespace-nowrap">
                    <span
                      className="gap-xs flex items-center"
                      style={{ color: statusColors[member.status] }}
                    >
                      <span
                        className="h-xs w-xs rounded-full"
                        style={{ backgroundColor: statusColors[member.status] }}
                      />
                      {member.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
