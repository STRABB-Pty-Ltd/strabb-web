"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { submenuConfigs, type SubmenuChip } from "@/lib/submenu-config";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

/** Chip-behavior logic shared by SubmenuBar (desktop row) and
 *  MobileNavDrawer (M.3) - extracted so a chip's click semantics
 *  (single-default/toggle/multi/exclusive/more-dropdown/nav, plus the
 *  per-page view-snapping side effects) exist in exactly one place rather
 *  than two copies that can drift. Safe to call on every page including
 *  settings (rules of hooks) - chips is empty there, matching
 *  SubmenuBar's own "no chips on settings" special case. */
export function useSubmenuChips() {
  const currentPage = useAppStore((s) => s.currentPage);
  const toggleSubmenuChip = useAppStore((s) => s.toggleSubmenuChip);
  const setSubmenu = useAppStore((s) => s.setSubmenu);
  const setView = useAppStore((s) => s.setView);
  const pathname = usePathname();
  const router = useRouter();

  const dashboardSubmenu = useAppStore((s) => s.dashboard.submenu);
  const calendarSubmenu = useAppStore((s) => s.calendar.submenu);
  const messagingSubmenu = useAppStore((s) => s.messaging.submenu);
  const operationsSubmenu = useAppStore((s) => s.operations.submenu);
  const reportingSubmenu = useAppStore((s) => s.reporting.submenu);

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close the "Coming soon"/More dropdown when navigating between pages -
  // both SubmenuBar and MobileNavDrawer are persistent shells that never
  // unmount, they just re-read currentPage, so without this reset the open
  // flag leaks across pages.
  useEffect(() => {
    setMoreOpen(false);
  }, [currentPage]);

  // Dismiss the dropdown on an outside click, like every other popover.
  useClickOutside(moreRef, () => setMoreOpen(false), moreOpen);

  const chips: SubmenuChip[] = currentPage === "settings" ? [] : submenuConfigs[currentPage];
  const activeSubmenu: string[] = {
    dashboard: dashboardSubmenu,
    calendar: calendarSubmenu,
    messaging: messagingSubmenu,
    operations: operationsSubmenu,
    reporting: reportingSubmenu,
    settings: [] as string[],
  }[currentPage];

  const pageRoute = `/${currentPage}`;
  const onNavSubRoute = chips.some(
    (c) => c.behavior === "nav" && c.href && pathname.startsWith(c.href),
  );

  const isChipActive = (chip: SubmenuChip): boolean => {
    if (chip.behavior === "nav") {
      return chip.href ? pathname === chip.href || pathname.startsWith(chip.href + "/") : false;
    }
    // When the user is on a nav-chip sub-route, no submenu chip is active -
    // the nav chip owns the highlight, including over Overview.
    if (onNavSubRoute) return false;
    return activeSubmenu.includes(chip.id);
  };

  const handleChipClick = (chip: SubmenuChip) => {
    const page = currentPage as Exclude<PageId, "settings">;

    // Each chip on a viewable page snaps the page to its default view.
    // Forced on every click - the user cannot stick on a non-default view
    // for a given chip; this is intentional per the chip-driven layout
    // (Overview = wide-zoom view, filtered chips = focused list/grid).
    if (page === "messaging" && chip.behavior !== "nav") {
      setView(page, chip.id === "overview" ? "kanban" : "list");
    }
    if (page === "operations" && chip.behavior !== "nav") {
      // Operations is kanban for every chip; the three views differ in shape,
      // not in list-vs-grid, so keep the view dimension constant.
      setView(page, "kanban");
    }
    if (page === "calendar" && chip.behavior !== "nav") {
      const calendarViewByChip: Record<string, "gantt" | "calendar" | "list"> = {
        overview: "gantt",
        bookings: "calendar",
        cleaning: "list",
        vacancy: "calendar",
        ticket: "gantt",
      };
      setView(page, calendarViewByChip[chip.id] ?? "gantt");
    }

    // If we're on a nav-chip sub-route (e.g. /settings/admin) and the user
    // clicks any non-nav chip, route back to the page root so the nav chip
    // deactivates and the clicked chip becomes the only active one.
    if (chip.behavior !== "nav" && onNavSubRoute) {
      router.push(pageRoute);
    }

    switch (chip.behavior) {
      case "single-default":
        setSubmenu(page, ["overview"]);
        break;
      case "toggle":
        toggleSubmenuChip(page, chip.id);
        break;
      case "multi": {
        const isActive = activeSubmenu.includes(chip.id);
        if (isActive) {
          const remaining = activeSubmenu.filter((c) => c !== chip.id && c !== "overview");
          if (remaining.length === 0) {
            setSubmenu(page, ["overview"]);
          } else {
            const next = activeSubmenu.filter((c) => c !== chip.id);
            setSubmenu(
              page,
              next.filter((c) => c !== "overview"),
            );
          }
        } else {
          const next = activeSubmenu.filter((c) => c !== "overview");
          setSubmenu(page, [...next, chip.id]);
        }
        break;
      }
      case "exclusive": {
        const isActive = activeSubmenu.includes(chip.id);
        if (isActive) {
          setSubmenu(page, ["overview"]);
        } else {
          setSubmenu(page, [chip.id]);
        }
        break;
      }
      case "more-dropdown":
        setMoreOpen((prev) => !prev);
        break;
      case "nav": {
        // Toggle: clicking an already-active nav chip goes back to the page
        // root so it can deselect like every other chip.
        if (!chip.href) break;
        const isOnTarget = pathname === chip.href || pathname.startsWith(chip.href + "/");
        router.push(isOnTarget ? pageRoute : chip.href);
        break;
      }
    }
  };

  // pathname/activeSubmenu/pageRoute/onNavSubRoute stay internal - they feed
  // isChipActive/handleChipClick above, but neither consumer (SubmenuBar,
  // MobileNavDrawer) nor the test suite reads them off the hook's result,
  // so they're not part of the public surface.
  return {
    currentPage,
    chips,
    isChipActive,
    handleChipClick,
    moreOpen,
    setMoreOpen,
    moreRef,
  };
}
