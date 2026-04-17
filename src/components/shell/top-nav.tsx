"use client";

import Link from "next/link";

import { topNavItems, settingsNavItem } from "@/lib/navigation";
import { useAppStore } from "@/stores/app-store";

export function TopNav() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="relative flex shrink-0 items-center"
      style={{
        backgroundColor: "var(--surface-60)",
      }}
    >
      {/* Page buttons — optical centre, shifted left by sidebar_width/4
          to counterbalance the sidebar's visual weight */}
      <div
        className="absolute top-1/2 flex items-center gap-xs"
        style={{
          left: "calc(50% - var(--sidebar-width) / 4)",
          transform: "translate(-50%, -50%)",
        }}
      >
        {topNavItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setCurrentPage(item.id)}
              aria-current={isActive ? "page" : undefined}
              className="flex items-center justify-center px-sm py-base text-body font-medium transition-colors"
              style={{
                width: 95,
                borderRadius: 5,
                backgroundColor: isActive ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
                color: isActive ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Spacer to push Settings to the right (buttons div is absolutely positioned) */}
      <div className="flex-1" />

      {/* Settings button */}
      <Link
        href={settingsNavItem.href}
        onClick={() => setCurrentPage(settingsNavItem.id)}
        aria-current={currentPage === "settings" ? "page" : undefined}
        className="mr-sm flex items-center justify-center px-sm py-base text-body font-medium transition-colors"
        style={{
          width: 95,
          borderRadius: 5,
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
