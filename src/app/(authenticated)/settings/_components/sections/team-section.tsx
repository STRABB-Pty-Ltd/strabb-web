"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { type Column, DataTable } from "@/components/ui/data-table";
import { mockTeamMembers, type MockTeamMember } from "@/lib/mock-team";
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

// Column widths w-[233px] and w-[89px] sit on the Fibonacci ladder
// (5/8/13/21/34/55/89/144/233/...) - kept as inline arbitrary widths.
// tracking-wide on the header row: known design exception, no project letter-spacing token.
const columns: Column<MockTeamMember>[] = [
  {
    key: "name",
    header: "Name",
    className: "text-highlight-10",
    render: (_v, row) => <span className="font-medium">{row.name}</span>,
  },
  {
    key: "email",
    header: "Email",
    className: "w-[233px] text-highlight-10",
  },
  {
    key: "role",
    header: "Role",
    className: "w-[89px]",
    render: (_v, row) => {
      const badge = roleBadgeColors[row.role] ?? roleBadgeColors.viewer;
      return (
        <span
          className="px-base py-xs text-body rounded-md font-medium capitalize"
          style={{ backgroundColor: badge.bg, color: badge.text }}
        >
          {row.role}
        </span>
      );
    },
  },
  {
    key: "lastLogin",
    header: "Last Login",
    className: "w-[89px] text-highlight-10",
  },
  {
    key: "status",
    header: "Status",
    className: "w-[89px]",
    render: (_v, row) => (
      <span className="gap-xs flex items-center" style={{ color: statusColors[row.status] }}>
        <span
          className="h-xs w-xs rounded-full"
          style={{ backgroundColor: statusColors[row.status] }}
        />
        {row.status}
      </span>
    ),
  },
];

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

      <DataTable<MockTeamMember>
        columns={columns}
        data={mockTeamMembers}
        headerRowClassName="bg-neutral-30 border-b"
        headerCellClassName="px-sm py-sm text-body text-highlight-10 text-left font-semibold tracking-wide uppercase"
      />
    </div>
  );
}
