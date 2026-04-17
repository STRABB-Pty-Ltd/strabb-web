"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

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
  const toggleCompare = useAppStore((s) => s.toggleCompare);

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

  const isChipActive = (chip: SubmenuChip): boolean => {
    if (chip.behavior === "toggle" && currentPage === "dashboard" && chip.id === "compare") {
      return dashboardCompare;
    }
    return activeSubmenu.includes(chip.id);
  };

  const handleChipClick = (chip: SubmenuChip) => {
    const page = currentPage as Exclude<PageId, "settings">;

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
    }
  };

  return (
    <div
      className="flex shrink-0 items-center justify-center gap-xs overflow-x-auto"
      style={{
        backgroundColor: "var(--surface-submenu)",
        paddingRight: "calc(var(--sidebar-width) / 2)",
      }}
    >
      {chips.map((chip) => {
        const active = isChipActive(chip);
        const isMore = chip.behavior === "more-dropdown";

        return (
          <div key={chip.id} className="relative" ref={isMore ? moreRef : undefined}>
            <button
              type="button"
              onClick={() => handleChipClick(chip)}
              aria-pressed={
                chip.behavior === "toggle" ||
                chip.behavior === "multi" ||
                chip.behavior === "exclusive"
                  ? active
                  : undefined
              }
              className="inline-flex shrink-0 items-center justify-center gap-xs border-0 whitespace-nowrap px-sm py-base text-body font-medium transition-colors"
              style={{
                width: 95,
                borderRadius: 5,
                backgroundColor: active ? "var(--btn-active-bg)" : "var(--btn-inactive-bg)",
                color: active ? "var(--btn-active-text)" : "var(--btn-inactive-text)",
              }}
            >
              {chip.label}
              {isMore && <ChevronDown size={13} />}
            </button>

            {isMore && moreOpen && (
              <div
                className="absolute top-full left-0 z-50 mt-xs rounded-lg bg-white py-xs shadow-md"
                style={{ minWidth: 144 }}
              >
                <div className="px-sm py-base text-body text-gray-400">Coming soon</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
