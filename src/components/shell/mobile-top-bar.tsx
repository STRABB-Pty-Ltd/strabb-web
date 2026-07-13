"use client";

import Link from "next/link";

import { useDashboardAlerts } from "@/hooks/use-dashboard";
import { pageLabels, settingsNavItem } from "@/lib/navigation";
import { useAppStore } from "@/stores/app-store";

import { NotificationsDropdown } from "./notifications-dropdown";
import { StrabbHeroIcon } from "./strabb-marks";

/**
 * Phone header: hero icon + page title (left), wordmark + notifications
 * chevron (center), Settings shortcut (right) - since Settings lives up
 * top rather than in the bottom bar, decision 10-07-2026 (team meeting).
 * Hidden at lg+ (1024px) alongside MobileBottomNav - see that component's
 * comment for why md (768px) wasn't a safe cutover for the desktop shell.
 *
 * M.1.1 follow-up to M.1: swapped the text "STRABB" wordmark for Will's
 * SVGs and added the notifications dropdown. Alerts are fetched here
 * (shell level, every page) rather than only on the dashboard page -
 * useDashboardAlertsAPI is a bare hook keyed on selectedListings, so this
 * shares the same TanStack Query cache entry as the dashboard page's own
 * call instead of double-fetching.
 *
 * The desktop shell's ContextualSidebar (filters/actions) and SubmenuBar
 * (view chips) have no mobile home yet - that's the hamburger-drawer phase
 * (M.3), not this one. Deliberately not shipping a hamburger button that
 * would open nothing.
 */
export function MobileTopBar() {
  const currentPage = useAppStore((s) => s.currentPage);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const { data: alerts } = useDashboardAlerts(selectedListings);
  const SettingsIcon = settingsNavItem.icon;

  return (
    <header
      className="px-md py-sm grid shrink-0 grid-cols-[1fr_auto_1fr] items-center lg:hidden"
      style={{ borderBottom: "var(--hairline) solid var(--border)" }}
    >
      <div className="gap-sm flex min-w-0 items-center">
        <StrabbHeroIcon className="text-highlight-10 h-6 w-6 shrink-0" />
        <span className="text-body truncate" style={{ color: "var(--text-secondary)" }}>
          {pageLabels[currentPage]}
        </span>
      </div>
      <NotificationsDropdown alerts={alerts ?? []} />
      <Link
        href={settingsNavItem.href}
        aria-label="Settings"
        aria-current={currentPage === "settings" ? "page" : undefined}
        className="ml-auto flex items-center justify-center rounded-lg"
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
