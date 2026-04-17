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
        backgroundColor: "var(--surface-60)",
      }}
    >
      {/* Mobile hamburger */}
      <button
        type="button"
        className="p-2 lg:hidden"
        style={{ marginLeft: "var(--space-sm)", color: "var(--brand-10)" }}
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <Menu size={24} />
      </button>

      {/* Page buttons */}
      <div className="flex flex-1 items-center justify-center gap-1">
        {topNavItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setCurrentPage(item.id)}
              aria-current={isActive ? "page" : undefined}
              className="flex items-center px-4 py-2 text-sm font-medium transition-colors"
              style={{
                borderRadius: 8,
                backgroundColor: isActive ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
                color: isActive ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
              }}
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
        className="mr-4 flex items-center px-4 py-2 text-sm font-medium transition-colors"
        style={{
          borderRadius: 8,
          backgroundColor:
            currentPage === "settings" ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
          color: currentPage === "settings" ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
        }}
      >
        {settingsNavItem.label}
      </Link>
    </nav>
  );
}
