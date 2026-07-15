"use client";

import { useEffect } from "react";

import { ChevronDown } from "lucide-react";

import { Drawer } from "@/components/ui/drawer";
import { chipVariants } from "@/components/ui/chip";
import { useIsMobile } from "@/hooks/use-responsive-view";
import { useSubmenuChips } from "@/hooks/use-submenu-chips";
import { pageLabels } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

import { ContextualSidebarSections, showTimeframe } from "./contextual-sidebar";
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
  const { chips, isChipActive, handleChipClick, moreOpen, moreRef } = useSubmenuChips();
  const isMobile = useIsMobile(1024);

  // Desktop (lg+) has its own always-visible ContextualSidebar/SubmenuBar -
  // this drawer has no reason to exist there. CSS-hiding it wouldn't be
  // enough: the store's mobileNavDrawer.open flag would stay true in the
  // background, so shrinking back down to mobile would silently reopen it
  // with no click. Actually close it on crossing the breakpoint instead.
  useEffect(() => {
    if (!isMobile && open) closeMobileNavDrawer();
  }, [isMobile, open, closeMobileNavDrawer]);

  if (currentPage === "settings") return null;

  // On timeframe pages the left slot IS the timeframe stepper - it reads
  // better grouped under the Day/Week/Fortnight/etc. picker than up near
  // the view chips, so it's threaded into ContextualSidebarSections right
  // after TimeframeSelector instead. Messaging's left slot (Templates/
  // Scheduled links) has no timeframe picker to sit under, so it stays up
  // top near the chips like before.
  const stepperBelongsToTimeframe = showTimeframe(currentPage);

  return (
    <Drawer
      open={open}
      onClose={closeMobileNavDrawer}
      title={pageLabels[currentPage]}
      side="left"
      width="mobile-nav"
      animation="slide-left"
      // TimeframePopup/SharePopup/ShoppingListPopup can all open from
      // inside this drawer (via ContextualSidebarSections' filters/
      // actions) and each has its own Escape handler. Deferring to
      // useKeyboardShortcuts' centralized "close topmost overlay" chain
      // (which checks those first, this drawer last) instead of handling
      // Escape here too avoids a single Escape closing the popup AND the
      // drawer underneath it in one keypress.
      closeOnEscape={false}
    >
      <div ref={moreRef} className="gap-xs flex flex-wrap justify-center">
        {chips.map((chip) => {
          const active = isChipActive(chip);
          const isMore = chip.behavior === "more-dropdown";
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                handleChipClick(chip);
                // "More" toggles an inline "Coming soon" note below the row
                // instead of navigating anywhere - closing the drawer on
                // that tap would hide the very feedback it just revealed,
                // and give the impression the tap did nothing at all.
                if (!isMore) closeMobileNavDrawer();
              }}
              aria-pressed={
                chip.behavior === "toggle" ||
                chip.behavior === "multi" ||
                chip.behavior === "exclusive"
                  ? active
                  : undefined
              }
              aria-haspopup={isMore ? "menu" : undefined}
              aria-expanded={isMore ? moreOpen : undefined}
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
              {isMore && <ChevronDown size={13} aria-hidden="true" />}
            </button>
          );
        })}
        {moreOpen && (
          <div className="px-sm py-base text-body text-highlight-10 w-full text-center">
            Coming soon
          </div>
        )}
      </div>

      {!stepperBelongsToTimeframe && (
        <div className="mt-base gap-xs flex flex-wrap items-center">
          <SubmenuLeftSlot />
        </div>
      )}

      <div
        className="my-sm shrink-0"
        style={{ height: "var(--hairline)", backgroundColor: "var(--neutral-30)" }}
      />

      <ContextualSidebarSections
        collapsibleListingFilter
        renderAfterTimeframe={
          stepperBelongsToTimeframe ? (
            <div className="p-sm gap-xs flex flex-wrap items-center justify-center">
              <SubmenuLeftSlot />
            </div>
          ) : undefined
        }
      />
    </Drawer>
  );
}
