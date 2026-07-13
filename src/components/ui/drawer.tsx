"use client";

import * as React from "react";
import { X } from "lucide-react";

import { useClickOutside } from "@/hooks/use-click-outside";
import { useDelayedClose } from "@/hooks/use-delayed-close";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { canvasOverlayStyle } from "@/lib/canvas-overlay-style";
import { cn } from "@/lib/utils";
import { Z } from "@/lib/z-index";

/* The one shared side-drawer shell (I.2, 13-07-2026). Generalises the
   DrillDownPanel recipe that thread-overlay, ticket-drawer and
   cleaner-picker-dialog had each hand-rolled: canvas-bounded fixed panel,
   optional scrim, keyframe enter/exit with delayed unmount, click-outside +
   optional Escape close, focus moved in on open and restored on close
   WITHOUT trapping Tab (side drawers keep the rails live, so no aria-modal). */

export const DRAWER_EXIT_MS = 200;

const ANIMATIONS = {
  "slide-right": { in: "slideInRight", out: "slideOutRight" },
  "slide-left": { in: "slideInLeft", out: "slideOutLeft" },
  fade: { in: "fadeIn", out: "fadeOut" },
} as const;

const WIDTHS = {
  drilldown: "var(--drilldown-width)",
  thread: "var(--thread-width)",
} as const;

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog; also the default header's heading. */
  title: string;
  children: React.ReactNode;
  /** Width token - 377px detail/form drawers vs the 610px thread. */
  width?: keyof typeof WIDTHS;
  animation?: keyof typeof ANIMATIONS;
  /** Canvas-bounded scrim behind the panel. Drawers stacked beside an
      already-scrimmed parent pass false. */
  scrim?: boolean;
  /** z pair - the thread family raises these above the drawer layer. */
  zIndex?: number;
  scrimZIndex?: number;
  /** Right inset - stacked drawers offset past their parent's width. */
  rightOffset?: string;
  /** Escape closes (default). The thread family opts out - app-shell owns
      Escape for that stack. */
  closeOnEscape?: boolean;
  /** Accent bar above the header (the drill-down treatment). Omit for none. */
  accentColor?: string;
  /** Replaces the default title + close-X header row entirely. The panel's
      accessible name stays `title` either way. */
  header?: React.ReactNode;
  /** Merged onto the scrolling body - e.g. drop padding for a pinned-composer
      layout. */
  bodyClassName?: string;
  /** Stop mousedown bubbling so a parent drawer's click-outside listener
      never sees clicks inside this stacked child. */
  isolate?: boolean;
  closeLabel?: string;
}

function Drawer({
  open,
  onClose,
  title,
  children,
  width = "drilldown",
  animation = "slide-right",
  scrim = true,
  zIndex = Z.DRAWER,
  scrimZIndex = Z.DRAWER_SCRIM,
  rightOffset = "var(--space-md)",
  closeOnEscape = true,
  accentColor,
  header,
  bodyClassName,
  isolate = false,
  closeLabel = "Close panel",
}: DrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  // Keep the panel mounted briefly after close so the exit keyframe can play.
  const { shouldRender } = useDelayedClose(open, DRAWER_EXIT_MS);

  useClickOutside(panelRef, onClose, open);
  // Side drawer: rails stay live, so no aria-modal and no Tab trap. The hook
  // still moves focus into the panel on open and restores it on close.
  useFocusTrap(panelRef, {
    active: open,
    onEscape: closeOnEscape ? onClose : undefined,
    trap: false,
  });

  if (!shouldRender) return null;

  const frames = ANIMATIONS[animation];

  return (
    <>
      {scrim && (
        <div
          data-slot="drawer-scrim"
          style={{
            ...canvasOverlayStyle,
            zIndex: scrimZIndex,
            backgroundColor: "var(--scrim)",
          }}
          onClick={onClose}
        />
      )}

      {/* Panel - canvas-bounded: top aligns with canvas content top so the
          panel never protrudes into the topnav/submenu. Right + bottom inset
          match canvas content padding from the screen edges. */}
      <div
        ref={panelRef}
        data-slot="drawer"
        role="dialog"
        aria-label={title}
        tabIndex={-1}
        className="fixed flex flex-col overflow-hidden rounded-2xl bg-[var(--neutral-30)] shadow-xl"
        style={{
          zIndex,
          top: "calc(var(--canvas-top) + var(--space-md) - 2px)",
          right: rightOffset,
          bottom: "var(--space-md)",
          width: WIDTHS[width],
          animation: !open
            ? `${frames.out} ${DRAWER_EXIT_MS}ms ease-in forwards`
            : `${frames.in} ${DRAWER_EXIT_MS}ms ease-out`,
        }}
        onMouseDown={isolate ? (e) => e.stopPropagation() : undefined}
      >
        {accentColor && (
          <div
            className="shrink-0"
            style={{ height: "var(--space-base)", backgroundColor: accentColor }}
          />
        )}

        {header ?? (
          <div
            data-slot="drawer-header"
            className="px-sm py-sm flex items-center justify-between border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h2 className="text-body text-highlight-10 font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="p-xs text-highlight-10 hover:bg-neutral-30 hover:text-highlight-10 rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              data-no-elevate
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div data-slot="drawer-body" className={cn("p-sm flex-1 overflow-y-auto", bodyClassName)}>
          {children}
        </div>
      </div>
    </>
  );
}

export { Drawer };
