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
  admin: { bg: "#DBEAFE", text: "#1E40AF" },
  manager: { bg: "#E0E7FF", text: "#3730A3" },
  cleaner: { bg: "#D1FAE5", text: "#065F46" },
  viewer: { bg: "#F3F4F6", text: "#6B7280" },
};

const statusColors: Record<string, string> = {
  active: "#16A34A",
  invited: "#D97706",
  inactive: "#6B7280",
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team</h2>
          <p className="text-sm text-gray-500">Manage team members and roles.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--strabb-secondary)" }}
        >
          <Plus size={16} />
          Invite Member
        </button>
      </div>

      {showInvite && (
        <div
          className="flex items-end gap-3 rounded-lg border bg-gray-50 p-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full rounded border bg-white px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded border bg-white px-3 py-2 text-sm"
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
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--strabb-secondary)" }}
          >
            Send Invite
          </button>
          <button
            type="button"
            onClick={() => setShowInvite(false)}
            className="rounded-lg p-2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <div className="flex border-b bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
          <div className="flex-1 px-4 py-3">Name</div>
          <div className="w-48 px-4 py-3">Email</div>
          <div className="w-24 px-4 py-3">Role</div>
          <div className="w-28 px-4 py-3">Last Login</div>
          <div className="w-20 px-4 py-3">Status</div>
        </div>
        {mockMembers.map((member) => {
          const badge = roleBadgeColors[member.role] ?? roleBadgeColors.viewer;
          return (
            <div
              key={member.id}
              className="flex items-center border-b text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex-1 px-4 py-3 font-medium text-gray-800">{member.name}</div>
              <div className="w-48 px-4 py-3 text-gray-500">{member.email}</div>
              <div className="w-24 px-4 py-3">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                  style={{ backgroundColor: badge.bg, color: badge.text }}
                >
                  {member.role}
                </span>
              </div>
              <div className="w-28 px-4 py-3 text-xs text-gray-400">{member.lastLogin}</div>
              <div className="w-20 px-4 py-3">
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: statusColors[member.status] }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
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
