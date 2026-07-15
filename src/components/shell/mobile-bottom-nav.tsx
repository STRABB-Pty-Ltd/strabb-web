"use client";

import Link from "next/link";

import { useCurrentUser } from "@/hooks/use-current-user";
import { isNavItemVisible, topNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

/**
 * Phone bottom tab bar (M.1). Settings lives in MobileTopBar instead of
 * here - decision 10-07-2026 (team meeting), see CLAUDE.md's shell note.
 *
 * Shading follows the same 60/30/10 pattern as desktop TopNav's pill
 * group (Will's M.3 feedback) rather than the cleaner portal's plain
 * text-colour-only tabs: bar bg = surface-60 (60), each unselected tab
 * = its own neutral-30 pill (30), the active tab = highlight-10 (10).
 *
 * Hidden at lg+ (1024px), not md (768px): the desktop TopNav's pill group
 * is absolutely-positioned (outside flex flow) and genuinely collides with
 * the flow-positioned Settings/Sign-out cluster below ~1024px - confirmed
 * empirically (overlap at 850px, clean at 1024px). Below lg, this bar
 * takes over instead of shipping a broken desktop nav.
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
      className="bg-surface-60 fixed right-0 bottom-0 left-0 z-10 lg:hidden"
      style={{ borderTop: "var(--hairline) solid var(--border)" }}
    >
      <div className="gap-xs p-xs flex">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setCurrentPage(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "gap-xs py-base text-body flex min-h-[var(--touch-target-min)] flex-1 flex-col items-center justify-center rounded-lg font-medium transition-colors",
                isActive ? "bg-highlight-10 text-surface-60" : "bg-neutral-30 text-highlight-10",
              )}
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
