import {
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  Globe,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Phone,
  Radio,
  Receipt,
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

// Single source for the page title shown in AppShell's sr-only <h1> and
// MobileTopBar - was previously a hardcoded duplicate map in app-shell.tsx.
export const pageLabels: Record<PageId, string> = Object.fromEntries(
  [...topNavItems, settingsNavItem].map((item) => [item.id, item.label]),
) as Record<PageId, string>;

// Settings' section tabs - shared by the desktop sidebar's vertical list
// (SettingsNavSection, lg+ only) and the mobile horizontal chip row
// (SettingsMobileNav, below lg): same sections, same click/active logic,
// different layout. Lives here rather than in either component's module
// so neither reaches into the other's internals (review finding, PR #64).
// Most tabs switch an in-page section via store state. Listings is
// route-driven (`href`): it lives at its own /settings/listings page, so
// its tab navigates there and lights up on that route rather than
// toggling section state.
export const settingsSections = [
  { id: "general", label: "General", icon: Settings },
  { id: "listings", label: "Listings", icon: Building2, href: "/settings/listings" },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "integrations", label: "Integrations", icon: Globe },
  { id: "cleaning", label: "Cleaning", icon: Sparkles },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "channels", label: "Channels", icon: Radio },
] as const;

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
