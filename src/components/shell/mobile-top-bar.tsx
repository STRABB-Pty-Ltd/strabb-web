"use client";

import Link from "next/link";

import { pageLabels, settingsNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

/**
 * Phone header (M.1): logo + current page title + a Settings shortcut,
 * since Settings lives up top rather than in the bottom bar - decision
 * 10-07-2026 (team meeting). Hidden at lg+ (1024px) alongside
 * MobileBottomNav - see that component's comment for why md (768px)
 * wasn't a safe cutover for the desktop shell.
 *
 * The desktop shell's ContextualSidebar (filters/actions) and SubmenuBar
 * (view chips) have no mobile home yet - that's the hamburger-drawer phase
 * (M.3), not this one. Deliberately not shipping a hamburger button that
 * would open nothing.
 *
 * Text wordmark, not the desktop shell's logo image: the image read too
 * small at a height matched to the page title beside it. Open question for
 * Will post-PR (text vs. graphic-only vs. something else) - not settled here.
 */
export function MobileTopBar() {
  const currentPage = useAppStore((s) => s.currentPage);
  const SettingsIcon = settingsNavItem.icon;

  return (
    <header
      className="px-md py-sm flex shrink-0 items-center justify-between lg:hidden"
      style={{ borderBottom: "var(--hairline) solid var(--border)" }}
    >
      <div className="gap-sm flex items-center">
        <span className="text-subheading text-highlight-10 font-semibold tracking-tight">
          STRABB
        </span>
        <span className="text-body text-[var(--text-secondary)]">{pageLabels[currentPage]}</span>
      </div>
      <Link
        href={settingsNavItem.href}
        aria-label="Settings"
        aria-current={currentPage === "settings" ? "page" : undefined}
        className={cn(
          "flex size-[var(--touch-target-min)] items-center justify-center rounded-lg",
          currentPage === "settings"
            ? "bg-highlight-10 text-surface-60"
            : "bg-neutral-30 text-highlight-10",
        )}
      >
        <SettingsIcon size={20} aria-hidden="true" />
      </Link>
    </header>
  );
}
