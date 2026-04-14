import {
  BarChart3,
  Building2,
  CalendarDays,
  Home,
  LayoutDashboard,
  List,
  MessageSquare,
  Settings,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { PageId } from "@/stores/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface TopNavItem {
  id: PageId;
  label: string;
  href: string;
  icon: LucideIcon;
}

// Legacy nav items — kept for backward compatibility during migration
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Properties", href: "/properties", icon: Building2 },
  { label: "Listings", href: "/listings", icon: List },
  { label: "Bookings", href: "/bookings", icon: CalendarDays },
  { label: "Automations", href: "/automations", icon: Zap },
  { label: "Settings", href: "/settings", icon: Settings },
];

// New top nav items matching mockup (5 main pages)
export const topNavItems: TopNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays },
  { id: "messaging", label: "Messaging", href: "/messaging", icon: MessageSquare },
  { id: "cleaning", label: "Cleaning", href: "/cleaning", icon: Sparkles },
  { id: "reporting", label: "Reporting", href: "/reporting", icon: BarChart3 },
];

export const settingsNavItem: TopNavItem = {
  id: "settings",
  label: "Settings",
  href: "/settings",
  icon: Settings,
};
