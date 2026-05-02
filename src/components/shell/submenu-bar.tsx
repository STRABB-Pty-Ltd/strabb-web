"use client";

import { useRef, useState } from "react";
import { CalendarClock, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { TimeframeStepper } from "@/components/views/timeframe-stepper";
import { submenuConfigs, type SubmenuChip } from "@/lib/submenu-config";
import { useAppStore } from "@/stores/app-store";
import type { PageId } from "@/stores/types";

function isSubmenuPage(page: PageId): page is Exclude<PageId, "settings"> {
  return page !== "settings";
}

export function SubmenuBar() {
  const currentPage = useAppStore((s) => s.currentPage);
  const toggleSubmenuChip = useAppStore((s) => s.toggleSubmenuChip);
  const setSubmenu = useAppStore((s) => s.setSubmenu);
  const setView = useAppStore((s) => s.setView);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const pathname = usePathname();
  const router = useRouter();

  const dashboardSubmenu = useAppStore((s) => s.dashboard.submenu);
  const dashboardCompare = useAppStore((s) => s.dashboard.compare);
  const calendarSubmenu = useAppStore((s) => s.calendar.submenu);
  const messagingSubmenu = useAppStore((s) => s.messaging.submenu);
  const cleaningSubmenu = useAppStore((s) => s.cleaning.submenu);
  const reportingSubmenu = useAppStore((s) => s.reporting.submenu);

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  if (!isSubmenuPage(currentPage)) return null;

  const chips = submenuConfigs[currentPage];
  const activeSubmenu: string[] = {
    dashboard: dashboardSubmenu,
    calendar: calendarSubmenu,
    messaging: messagingSubmenu,
    cleaning: cleaningSubmenu,
    reporting: reportingSubmenu,
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
    if (chip.behavior === "toggle" && currentPage === "dashboard" && chip.id === "compare") {
      return dashboardCompare;
    }
    return activeSubmenu.includes(chip.id);
  };

  const handleChipClick = (chip: SubmenuChip) => {
    const page = currentPage as Exclude<PageId, "settings">;

    // Each chip on a viewable page snaps the page to its default view.
    // Forced on every click - the user cannot stick on a non-default view
    // for a given chip; this is intentional per the chip-driven layout
    // (Overview = wide-zoom view, filtered chips = focused list/grid).
    if ((page === "messaging" || page === "cleaning") && chip.behavior !== "nav") {
      setView(page, chip.id === "overview" ? "kanban" : "list");
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

    // If we're on a nav-chip sub-route (e.g. /cleaning/tickets) and the user
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
        if (page === "dashboard" && chip.id === "compare") {
          toggleCompare();
        } else {
          toggleSubmenuChip(page, chip.id);
        }
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

  return (
    <div
      className="relative flex shrink-0 items-center"
      style={{
        backgroundColor: "var(--surface-submenu)",
        paddingRight: "calc(var(--sidebar-width) / 2)",
        // Match a chip's natural height (py-base × 2 + text-body line-height)
        // so the absolute-centred chips don't extend above the row's bounding
        // box and skew the separator line above this row.
        minHeight: "calc(2 * var(--spacing-base) + var(--text-body) * 1.615)",
      }}
    >
      {/* Left: page-specific widget (timeframe stepper, scheduled-messages link, …) */}
      <div className="px-md flex shrink-0 items-center">
        {currentPage === "messaging" ? (
          <Link
            href="/messaging/scheduled"
            className="gap-xs px-xs py-xs text-body inline-flex items-center rounded-sm font-semibold hover:bg-gray-100"
          >
            <CalendarClock size={16} />
            Scheduled messages
          </Link>
        ) : (
          <TimeframeStepper />
        )}
      </div>

      {/* Centered chip group, mirrors TopNav's optical-centre pattern */}
      <div
        className="gap-xs absolute top-1/2 flex items-center"
        style={{
          left: "calc(50% - var(--sidebar-width) / 4)",
          transform: "translate(-50%, -50%)",
        }}
      >
        {chips.map((chip) => {
          const active = isChipActive(chip);
          const isMore = chip.behavior === "more-dropdown";
          const isNav = chip.behavior === "nav";

          const chipClass =
            "gap-xs px-sm py-base text-body inline-flex shrink-0 cursor-pointer items-center justify-center border-0 font-medium whitespace-nowrap outline-none transition-all hover:opacity-80 active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2";
          const chipStyle = {
            width: "var(--btn-pill-width)",
            borderRadius: "var(--radius-md)",
            backgroundColor: active ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
            color: active ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
          };

          if (isNav && chip.href) {
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipClick(chip)}
                aria-pressed={active}
                className={chipClass}
                style={chipStyle}
              >
                {chip.label}
              </button>
            );
          }

          // The More dropdown needs a positioned wrapper so the menu can
          // anchor under it. Other chips render directly as flex children
          // - same structure as TopNav so the parent's gap applies cleanly.
          if (isMore) {
            return (
              <div key={chip.id} className="relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className={chipClass}
                  style={chipStyle}
                >
                  {chip.label}
                  <ChevronDown size={13} />
                </button>
                {moreOpen && (
                  <div
                    className="mt-xs py-xs absolute top-full left-0 z-50 rounded-lg bg-white shadow-md"
                    style={{ minWidth: 144 }} // = --space-xl + --space-xl + --space-lg (Fibonacci 144)
                  >
                    <div className="px-sm py-base text-body text-gray-400">Coming soon</div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleChipClick(chip)}
              aria-pressed={
                chip.behavior === "toggle" ||
                chip.behavior === "multi" ||
                chip.behavior === "exclusive"
                  ? active
                  : undefined
              }
              className={chipClass}
              style={chipStyle}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />
    </div>
  );
}
