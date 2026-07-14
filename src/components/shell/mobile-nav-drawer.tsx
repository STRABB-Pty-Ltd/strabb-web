"use client";

import { Drawer } from "@/components/ui/drawer";
import { chipVariants } from "@/components/ui/chip";
import { useSubmenuChips } from "@/hooks/use-submenu-chips";
import { pageLabels } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

import { ContextualSidebarSections } from "./contextual-sidebar";
import { SubmenuLeftSlot } from "./submenu-left-slot";

/** Mobile hamburger nav drawer (M.3): view chips first, then the same
 *  page-specific left-slot widget and filters/actions the desktop rail
 *  shows, via the shared ContextualSidebarSections/useSubmenuChips
 *  extractions so nothing here is a second, driftable copy. Settings is
 *  excluded - SettingsMobileNav already owns that page's mobile nav and
 *  ContextualSidebarSections renders nothing extra there. Chips close the
 *  drawer on click (one-shot navigational choice); filters/actions below
 *  don't (often multi-step, e.g. ticking several listings in a row). */
export function MobileNavDrawer() {
  const open = useAppStore((s) => s.mobileNavDrawer.open);
  const closeMobileNavDrawer = useAppStore((s) => s.closeMobileNavDrawer);
  const currentPage = useAppStore((s) => s.currentPage);
  const { chips, isChipActive, handleChipClick } = useSubmenuChips();

  if (currentPage === "settings") return null;

  return (
    <Drawer
      open={open}
      onClose={closeMobileNavDrawer}
      title={pageLabels[currentPage]}
      side="left"
      width="mobile-nav"
      animation="slide-left"
    >
      <div className="gap-xs flex flex-wrap">
        {chips.map((chip) => {
          const active = isChipActive(chip);
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                handleChipClick(chip);
                closeMobileNavDrawer();
              }}
              aria-pressed={
                chip.behavior === "toggle" ||
                chip.behavior === "multi" ||
                chip.behavior === "exclusive"
                  ? active
                  : undefined
              }
              className={cn(
                chipVariants({
                  tone: active ? "accent" : "neutral",
                  size: null,
                  radius: "md",
                  interactive: true,
                }),
                "px-sm py-base border-0 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="mt-base gap-xs flex flex-wrap items-center">
        <SubmenuLeftSlot />
      </div>

      <div
        className="my-sm shrink-0"
        style={{ height: "var(--hairline)", backgroundColor: "var(--neutral-30)" }}
      />

      <ContextualSidebarSections collapsibleListingFilter />
    </Drawer>
  );
}
