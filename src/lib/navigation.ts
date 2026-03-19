import { Building2, CalendarDays, Home, List, Settings, Zap, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Properties", href: "/properties", icon: Building2 },
  { label: "Listings", href: "/listings", icon: List },
  { label: "Bookings", href: "/bookings", icon: CalendarDays },
  { label: "Automations", href: "/automations", icon: Zap },
  { label: "Settings", href: "/settings", icon: Settings },
];
