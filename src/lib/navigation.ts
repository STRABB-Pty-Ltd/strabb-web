import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { PageId } from "@/stores/types";
import type { UserRole } from "@/types/auth";

export interface TopNavItem {
  id: PageId;
  label: string;
  href: string;
  icon: LucideIcon;
  // Roles allowed to see this nav item. Undefined = visible to every role.
  // This is UX hiding ONLY; the API role matrix (Phase B.1) is the enforcement
  // layer. A cleaner who deep-links a hidden route is bounced by middleware and,
  // failing that, the API returns 403.
  roles?: UserRole[];
}

// Top nav items matching mockup (5 main pages)
export const topNavItems: TopNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["owner", "admin"],
  },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays },
  { id: "messaging", label: "Messaging", href: "/messaging", icon: MessageSquare },
  { id: "operations", label: "Operations", href: "/operations", icon: Sparkles },
  {
    id: "reporting",
    label: "Reporting",
    href: "/reporting",
    icon: BarChart3,
    roles: ["owner", "admin"],
  },
];

export const settingsNavItem: TopNavItem = {
  id: "settings",
  label: "Settings",
  href: "/settings",
  icon: Settings,
  roles: ["owner", "admin"],
};

/**
 * Filter a nav item by the current role. An item with no `roles` is visible to
 * everyone; an item with `roles` is visible only to those roles. A null role
 * (session still loading) hides role-restricted items until the role resolves,
 * which avoids a flash of owner-only tabs for a cleaner.
 */
export function isNavItemVisible(item: TopNavItem, role: UserRole | null): boolean {
  if (!item.roles) return true;
  return role !== null && item.roles.includes(role);
}
