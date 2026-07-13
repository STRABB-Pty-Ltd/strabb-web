"use client";

import Link from "next/link";

import { pageLabels, settingsNavItem } from "@/lib/navigation";
import { useAppStore } from "@/stores/app-store";

/**
 * Phone header (M.1): wordmark + current page title + a Settings shortcut,
 * since Settings lives up top rather than in the bottom bar - decision
 * 10-07-2026 (team meeting). Hidden at md+, where TopNav takes over.
 *
 * The desktop shell's ContextualSidebar (filters/actions) and SubmenuBar
 * (view chips) have no mobile home yet - that's the hamburger-drawer phase
 * (M.3), not this one. Deliberately not shipping a hamburger button that
 * would open nothing.
 */
export function MobileTopBar() {
  const currentPage = useAppStore((s) => s.currentPage);
  const SettingsIcon = settingsNavItem.icon;

  return (
    <header
      className="px-md py-sm flex shrink-0 items-center justify-between md:hidden"
      style={{ borderBottom: "var(--hairline) solid var(--border)" }}
    >
      <div className="gap-sm flex items-center">
        <span className="text-subheading text-highlight-10 font-semibold tracking-tight">
          STRABB
        </span>
        <span className="text-body" style={{ color: "var(--text-secondary)" }}>
          {pageLabels[currentPage]}
        </span>
      </div>
      <Link
        href={settingsNavItem.href}
        aria-label="Settings"
        aria-current={currentPage === "settings" ? "page" : undefined}
        className="flex items-center justify-center rounded-lg"
        style={{
          width: "var(--touch-target-min)",
          height: "var(--touch-target-min)",
          backgroundColor: currentPage === "settings" ? "var(--highlight-10)" : "var(--neutral-30)",
          color: currentPage === "settings" ? "var(--surface-60)" : "var(--highlight-10)",
        }}
      >
        <SettingsIcon size={20} aria-hidden="true" />
      </Link>
    </header>
  );
}
