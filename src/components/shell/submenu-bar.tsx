"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, ChevronDown, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { TimeframeStepper } from "@/components/views/timeframe-stepper";
import { useClickOutside } from "@/hooks/use-click-outside";
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
  const pathname = usePathname();
  const router = useRouter();

  const dashboardSubmenu = useAppStore((s) => s.dashboard.submenu);
  const calendarSubmenu = useAppStore((s) => s.calendar.submenu);
  const messagingSubmenu = useAppStore((s) => s.messaging.submenu);
  const operationsSubmenu = useAppStore((s) => s.operations.submenu);
  const reportingSubmenu = useAppStore((s) => s.reporting.submenu);

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close the "Coming soon"/More dropdown when navigating between pages.
  // SubmenuBar is a persistent shell - it never unmounts, it just re-reads
  // currentPage from the store - so without this reset the open flag leaks
  // across pages and the destination's more-dropdown chip renders already-open.
  useEffect(() => {
    setMoreOpen(false);
  }, [currentPage]);

  // Dismiss the dropdown on an outside click, like every other popover.
  useClickOutside(moreRef, () => setMoreOpen(false), moreOpen);

  if (!isSubmenuPage(currentPage)) return null;

  const chips = submenuConfigs[currentPage];
  const activeSubmenu: string[] = {
    dashboard: dashboardSubmenu,
    calendar: calendarSubmenu,
    messaging: messagingSubmenu,
    operations: operationsSubmenu,
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

  return (
    <div
      className="relative flex shrink-0 items-center"
      style={{
        backgroundColor: "var(--surface-60)",
        paddingRight: "calc(var(--sidebar-width) / 2)",
        // Fixed at a chip's natural height (py-base × 2 + text-body line-height)
        // so the absolute-centred chips and the separator above stay aligned.
        // A FIXED (not min) height caps the row: the messaging "Scheduled
        // messages" link keeps its 44px WCAG hit-area by overflowing this row
        // rather than inflating it (the inflation previously skewed the
        // separator above, only on messaging).
        height: "calc(2 * var(--spacing-base) + var(--text-body) * 1.615)",
      }}
    >
      {/* Left: page-specific widget (timeframe stepper, or the messaging
          sub-route links: Templates + Scheduled). */}
      <div className="px-md gap-xs flex shrink-0 items-center">
        {currentPage === "messaging" ? (
          [
            { href: "/messaging/templates", label: "Templates", icon: FileText },
            { href: "/messaging/scheduled", label: "Scheduled messages", icon: CalendarClock },
          ].map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="gap-xs px-base py-base text-body hover:bg-neutral-30 inline-flex min-h-[var(--touch-target-min)] items-center rounded-sm font-semibold"
                style={{
                  backgroundColor: active ? "var(--neutral-30)" : undefined,
                  color: "var(--highlight-10)",
                }}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </Link>
            );
          })
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
            backgroundColor: active ? "var(--highlight-10)" : "var(--neutral-30)",
            color: active ? "var(--surface-60)" : "var(--highlight-10)",
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
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  className={chipClass}
                  style={chipStyle}
                >
                  {chip.label}
                  <ChevronDown size={13} aria-hidden="true" />
                </button>
                {moreOpen && (
                  <div
                    className="mt-xs py-xs bg-surface-60 absolute top-full left-0 z-50 rounded-lg shadow-md"
                    style={{ minWidth: 144 }} // = --space-xl + --space-xl + --space-lg (Fibonacci 144)
                  >
                    <div className="px-sm py-base text-body text-highlight-10">Coming soon</div>
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
