"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { topNavItems, settingsNavItem } from "@/lib/navigation";
import { useAppStore } from "@/stores/app-store";

export function TopNav() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="flex shrink-0 items-center"
      style={{
        height: "var(--topnav-height)",
        backgroundColor: "var(--strabb-primary)",
      }}
    >
      {/* Mobile hamburger */}
      <button
        type="button"
        className="p-2 text-white lg:hidden"
        style={{ marginLeft: "var(--space-sm)" }}
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <Menu size={24} />
      </button>

      {/* Logo */}
      <span
        className="font-data shrink-0 text-lg font-bold text-white"
        style={{ paddingLeft: "var(--space-md)" }}
      >
        STRABB
      </span>

      {/* Page buttons */}
      <div className="flex flex-1 items-center justify-center gap-1">
        {topNavItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setCurrentPage(item.id)}
              aria-current={isActive ? "page" : undefined}
              className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              style={
                isActive
                  ? { backgroundColor: "var(--strabb-secondary)", borderRadius: 8 }
                  : undefined
              }
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Settings button */}
      <Link
        href={settingsNavItem.href}
        onClick={() => setCurrentPage(settingsNavItem.id)}
        aria-current={currentPage === "settings" ? "page" : undefined}
        className="mr-4 flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        style={
          currentPage === "settings"
            ? { backgroundColor: "var(--strabb-secondary)", borderRadius: 8 }
            : undefined
        }
      >
        {settingsNavItem.label}
      </Link>
    </nav>
  );
}
