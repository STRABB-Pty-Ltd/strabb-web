"use client";

import { Menu } from "lucide-react";
import Link from "next/link";

import { useDashboardAlerts } from "@/hooks/use-dashboard";
import { useIsMobile } from "@/hooks/use-responsive-view";
import { pageLabels, settingsNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
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
 * call instead of double-fetching. Gated on useIsMobile(1024): this header
 * is only CSS-hidden (`lg:hidden`) at lg+, not unmounted, so without the
 * enabled flag the query would fire on every page for every desktop user
 * too, feeding a dropdown that never renders there (review finding, PR #62).
 *
 * The desktop shell's ContextualSidebar (filters/actions) and SubmenuBar
 * (view chips) render together in MobileNavDrawer (M.3), toggled by the
 * hamburger button below (open when closed, close when already open -
 * matches Drawer's own scrim/Escape/click-outside close paths rather than
 * fighting them). Settings is excluded - SettingsMobileNav already owns
 * that page's mobile nav and the drawer renders nothing there.
 */
export function MobileTopBar() {
  const currentPage = useAppStore((s) => s.currentPage);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const mobileNavDrawerOpen = useAppStore((s) => s.mobileNavDrawer.open);
  const openMobileNavDrawer = useAppStore((s) => s.openMobileNavDrawer);
  const closeMobileNavDrawer = useAppStore((s) => s.closeMobileNavDrawer);
  const isMobile = useIsMobile(1024);
  const { data: alerts } = useDashboardAlerts(selectedListings, isMobile);
  const SettingsIcon = settingsNavItem.icon;

  return (
    <header
      className="px-md py-sm grid shrink-0 grid-cols-[1fr_auto_1fr] items-center lg:hidden"
      style={{ borderBottom: "var(--hairline) solid var(--border)" }}
    >
      <div className="gap-sm flex min-w-0 items-center">
        {currentPage !== "settings" && (
          <button
            type="button"
            data-slot="mobile-nav-trigger"
            onClick={mobileNavDrawerOpen ? closeMobileNavDrawer : openMobileNavDrawer}
            aria-label="Open menu"
            aria-expanded={mobileNavDrawerOpen}
            aria-haspopup="dialog"
            className="bg-neutral-30 text-highlight-10 flex size-[var(--touch-target-min)] shrink-0 items-center justify-center rounded-lg"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        )}
        <StrabbHeroIcon className="text-highlight-10 h-6 w-6 shrink-0" />
        <span className="text-body truncate text-[var(--text-secondary)]">
          {pageLabels[currentPage]}
        </span>
      </div>
      <NotificationsDropdown alerts={alerts ?? []} />
      <Link
        href={settingsNavItem.href}
        aria-label="Settings"
        aria-current={currentPage === "settings" ? "page" : undefined}
        className={cn(
          "ml-auto flex size-[var(--touch-target-min)] items-center justify-center rounded-lg",
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
