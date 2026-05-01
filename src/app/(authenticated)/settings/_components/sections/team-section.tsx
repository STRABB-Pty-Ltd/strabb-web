"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { useAppStore } from "@/stores/app-store";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "cleaner" | "viewer";
  lastLogin: string;
  status: "active" | "invited" | "inactive";
}

const mockMembers: TeamMember[] = [
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
    role: "cleaner",
    lastLogin: "2026-04-12",
    status: "active",
  },
  {
    id: "u-4",
    name: "Tom Williams",
    email: "tom.w@cleanteam.com",
    role: "cleaner",
    lastLogin: "2026-04-10",
    status: "active",
  },
  {
    id: "u-5",
    name: "Jen Liu",
    email: "jen.l@cleanteam.com",
    role: "cleaner",
    lastLogin: "2026-04-11",
    status: "active",
  },
];

const roleBadgeColors: Record<string, { bg: string; text: string }> = {
  admin: { bg: "var(--neutral-30)", text: "var(--brand-10)" },
  manager: { bg: "var(--neutral-30)", text: "var(--brand-10)" },
  cleaner: { bg: "var(--neutral-30)", text: "var(--status-success)" },
  viewer: { bg: "var(--neutral-30)", text: "var(--brand-10)" },
};

const statusColors: Record<string, string> = {
  active: "var(--status-success)",
  invited: "var(--status-danger)",
  inactive: "var(--brand-10)",
};

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
          <h2 className="text-subheading font-semibold text-gray-900">Team</h2>
          <p className="text-body text-gray-500">Manage team members and roles.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="gap-xs px-sm py-base text-body flex items-center rounded-lg font-medium text-white"
          style={{ backgroundColor: "var(--strabb-secondary)" }}
        >
          <Plus size={16} />
          Invite Member
        </button>
      </div>

      {showInvite && (
        <div
          className="gap-sm p-sm flex items-end rounded-lg border bg-gray-50"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex-1">
            <label className="mb-xs text-body block font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoComplete="email"
              className="px-sm py-base text-body w-full rounded-sm border bg-white"
              style={{ borderColor: "var(--border)" }}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="mb-xs text-body block font-medium text-gray-600">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-sm py-base text-body rounded-sm border bg-white"
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
            className="px-sm py-base text-body rounded-lg font-medium text-white"
            style={{ backgroundColor: "var(--strabb-secondary)" }}
          >
            Send Invite
          </button>
          <button
            type="button"
            onClick={() => setShowInvite(false)}
            aria-label="Cancel invitation"
            className="p-base rounded-lg text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Column widths w-[233px] and w-[89px] are arbitrary values on the Fibonacci ladder
          (5/8/13/21/34/55/89/144/233/...) - kept as inline arbitrary widths.
          tracking-wide on the header row: known design exception, no project letter-spacing token. */}
      <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <div className="text-body flex border-b bg-gray-50 font-semibold tracking-wide text-gray-500 uppercase">
          <div className="px-sm py-sm flex-1">Name</div>
          <div className="px-sm py-sm w-[233px]">Email</div>
          <div className="px-sm py-sm w-[89px]">Role</div>
          <div className="px-sm py-sm w-[89px]">Last Login</div>
          <div className="px-sm py-sm w-[89px]">Status</div>
        </div>
        {mockMembers.map((member) => {
          const badge = roleBadgeColors[member.role] ?? roleBadgeColors.viewer;
          return (
            <div
              key={member.id}
              className="text-body flex items-center border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="px-sm py-sm flex-1 font-medium text-gray-800">{member.name}</div>
              <div className="px-sm py-sm w-[233px] text-gray-500">{member.email}</div>
              <div className="px-sm py-sm w-[89px]">
                <span
                  className="px-base py-xs text-body rounded-full font-medium capitalize"
                  style={{ backgroundColor: badge.bg, color: badge.text }}
                >
                  {member.role}
                </span>
              </div>
              <div className="px-sm py-sm text-body w-[89px] text-gray-400">{member.lastLogin}</div>
              <div className="px-sm py-sm w-[89px]">
                <span
                  className="gap-xs text-body flex items-center"
                  style={{ color: statusColors[member.status] }}
                >
                  <span
                    className="h-xs w-xs rounded-full"
                    style={{
                      backgroundColor: statusColors[member.status],
                    }}
                  />
                  {member.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
