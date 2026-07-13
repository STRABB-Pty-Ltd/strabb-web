"use client";

import Link from "next/link";

import { useCurrentUser } from "@/hooks/use-current-user";
import { isNavItemVisible, topNavItems } from "@/lib/navigation";
import { useAppStore } from "@/stores/app-store";

/**
 * Phone bottom tab bar (M.1). Adapts the cleaner portal's proven pattern
 * (src/app/(portal)/_components/portal-nav.tsx) to the 5 main app pages.
 * Settings lives in MobileTopBar instead of here - decision 10-07-2026
 * (team meeting), see CLAUDE.md's shell note. Hidden at md+, where TopNav
 * (in the desktop shell) takes over.
 */
export function MobileBottomNav() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  // Role-aware nav is UX hiding only; the API role matrix is the real gate.
  const { role } = useCurrentUser();
  const visibleNavItems = topNavItems.filter((item) => isNavItemVisible(item, role));

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed right-0 bottom-0 left-0 z-10 md:hidden"
      style={{
        borderTop: "var(--hairline) solid var(--border)",
        backgroundColor: "var(--surface-60)",
      }}
    >
      <div className="flex">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setCurrentPage(item.id)}
              aria-current={isActive ? "page" : undefined}
              className="gap-xs py-base text-body flex flex-1 flex-col items-center justify-center font-medium"
              style={{
                minHeight: "var(--touch-target-min)",
                color: isActive ? "var(--highlight-10)" : "var(--text-secondary)",
              }}
            >
              <Icon size={20} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
