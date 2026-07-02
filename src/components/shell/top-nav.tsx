"use client";

import Link from "next/link";

import { BillingNavPill } from "@/components/billing/billing-nav-pill";
import { useCurrentUser } from "@/hooks/use-current-user";
import { topNavItems, settingsNavItem, isNavItemVisible } from "@/lib/navigation";
import { useAppStore } from "@/stores/app-store";

export function TopNav() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  // Role-aware nav is UX hiding only; the API role matrix is the real gate.
  const { role } = useCurrentUser();
  const visibleNavItems = topNavItems.filter((item) => isNavItemVisible(item, role));
  const showSettings = isNavItemVisible(settingsNavItem, role);

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="relative flex shrink-0 items-center"
      style={{
        backgroundColor: "var(--surface-60)",
      }}
    >
      {/* Page buttons - optical centre, shifted left by sidebar_width/4
          to counterbalance the sidebar's visual weight */}
      <div
        className="gap-xs absolute top-1/2 flex items-center"
        style={{
          left: "calc(50% - var(--sidebar-width) / 4)",
          transform: "translate(-50%, -50%)",
        }}
      >
        {visibleNavItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setCurrentPage(item.id)}
              aria-current={isActive ? "page" : undefined}
              className="px-sm py-base text-body flex items-center justify-center font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              style={{
                width: "var(--btn-pill-width)",
                borderRadius: "var(--radius-md)",
                backgroundColor: isActive ? "var(--highlight-10)" : "var(--neutral-30)",
                color: isActive ? "var(--surface-60)" : "var(--highlight-10)",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Spacer to push Settings to the right (buttons div is absolutely positioned) */}
      <div className="flex-1" />

      <BillingNavPill />

      {/* Settings button - hidden for roles outside settingsNavItem.roles (UX only) */}
      {showSettings && (
        <Link
          href={settingsNavItem.href}
          onClick={() => setCurrentPage(settingsNavItem.id)}
          aria-current={currentPage === "settings" ? "page" : undefined}
          className="mr-sm px-sm py-base text-body flex items-center justify-center font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
          style={{
            width: "var(--btn-pill-width)",
            borderRadius: "var(--radius-md)",
            backgroundColor:
              currentPage === "settings" ? "var(--highlight-10)" : "var(--neutral-30)",
            color: currentPage === "settings" ? "var(--surface-60)" : "var(--highlight-10)",
          }}
        >
          {settingsNavItem.label}
        </Link>
      )}
    </nav>
  );
}
