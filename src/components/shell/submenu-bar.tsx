"use client";

import { ChevronDown } from "lucide-react";

import { chipVariants } from "@/components/ui/chip";
import { useSubmenuChips } from "@/hooks/use-submenu-chips";
import { cn } from "@/lib/utils";

import { SubmenuLeftSlot } from "./submenu-left-slot";

// Fixed at a chip's natural height (py-base × 2 + text-body line-height) so
// the absolute-centred chips and the separator above stay aligned. A FIXED
// (not min) height caps the row: the messaging "Scheduled messages" link
// keeps its 44px WCAG hit-area by overflowing this row rather than inflating
// it (the inflation previously skewed the separator above, only on
// messaging). Also the height of the settings spacer below - --canvas-top
// (globals.css) assumes this row exists on EVERY page.
const ROW_HEIGHT = "calc(2 * var(--spacing-base) + var(--text-body) * 1.615)";

export function SubmenuBar() {
  const { currentPage, chips, isChipActive, handleChipClick, moreOpen, moreRef } =
    useSubmenuChips();

  // Settings has no chips, but the row still occupies its height so the rail
  // is constant across pages: the sidebar's logo-area spacer and the vertical
  // separator are both derived from --canvas-top, which assumes this row.
  // Returning null here collapsed the rail 37px on settings and left a dead
  // band above the settings nav (13-07-2026).
  if (currentPage === "settings") {
    return <div aria-hidden="true" className="shrink-0" style={{ height: ROW_HEIGHT }} />;
  }

  return (
    <div
      className="bg-surface-60 relative flex shrink-0 items-center"
      style={{
        paddingRight: "calc(var(--sidebar-width) / 2)",
        height: ROW_HEIGHT,
      }}
    >
      {/* Left: page-specific widget (timeframe stepper, or the messaging
          sub-route links: Templates + Scheduled). */}
      <div className="px-md gap-xs flex shrink-0 items-center">
        <SubmenuLeftSlot />
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

          // chipVariants composed onto the raw <button> (the chip.tsx-documented
          // pattern). size is null: the pill's px-sm py-base padding is
          // supplied as extras because the custom spacing ladder isn't
          // registered in cn()'s twMerge config, so a size variant's py-xs
          // could not be reliably overridden (see gotchas.md, tailwind-merge).
          // The active flip maps to tones: accent = highlight-10/surface-60,
          // neutral = neutral-30/highlight-10 - same tokens as before. The
          // focus-visible ring overrides preserve the pre-existing ring look
          // (solid --ring, 2px, offset) over the primitive's ring-3/50%.
          const chipClass = cn(
            chipVariants({
              tone: active ? "accent" : "neutral",
              size: null,
              radius: "md",
              interactive: true,
            }),
            "px-sm py-base w-[var(--btn-pill-width)] border-0 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
          );

          if (isNav && chip.href) {
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipClick(chip)}
                aria-pressed={active}
                className={chipClass}
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
