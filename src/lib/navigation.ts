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

export interface TopNavItem {
  id: PageId;
  label: string;
  href: string;
  icon: LucideIcon;
}

// Top nav items matching mockup (5 main pages)
export const topNavItems: TopNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarDays },
  { id: "messaging", label: "Messaging", href: "/messaging", icon: MessageSquare },
  { id: "operations", label: "Operations", href: "/operations", icon: Sparkles },
  { id: "reporting", label: "Reporting", href: "/reporting", icon: BarChart3 },
];

export const settingsNavItem: TopNavItem = {
  id: "settings",
  label: "Settings",
  href: "/settings",
  icon: Settings,
};
