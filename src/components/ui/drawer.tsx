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

/* Clamped to the viewport (--drilldown-panel-width/--thread-panel-width/
   --mobile-nav-drawer-width in globals.css), not raw fixed widths: those
   are wider than a phone screen, which used to push the panel's left edge
   off-screen with no left inset to catch it. */
const WIDTHS = {
  drilldown: "var(--drilldown-panel-width)",
  thread: "var(--thread-panel-width)",
  "mobile-nav": "var(--mobile-nav-drawer-width)",
} as const;

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog; also the default header's heading. */
  title: string;
  children: React.ReactNode;
  /** Width token - 377px detail/form drawers, 610px thread, or the mobile
      nav drawer's own width. */
  width?: keyof typeof WIDTHS;
  animation?: keyof typeof ANIMATIONS;
  /** Canvas-bounded scrim behind the panel. Drawers stacked beside an
      already-scrimmed parent pass false. */
  scrim?: boolean;
  /** z pair - the thread family raises these above the drawer layer. */
  zIndex?: number;
  scrimZIndex?: number;
  /** Which edge the panel is anchored to and slides from. "right" (default)
      for detail/form/thread panels; "left" for the mobile nav drawer, which
      shares the edge the desktop sidebar occupies. */
  side?: "left" | "right";
  /** Right inset - stacked drawers offset past their parent's width.
      Ignored when side="left" (there's nothing to stack a left drawer
      against today). */
  rightOffset?: string;
  /** Escape closes (default). The thread family opts out - app-shell owns
      Escape for that stack. */
  closeOnEscape?: boolean;
  /** Accent bar above the header (the drill-down treatment). Omit for none. */
  accentColor?: string;
  /** One-line subtitle under the default header's title. */
  description?: string;
  /** Replaces the default title + close-X header row entirely. The panel's
      accessible name stays `title` either way. */
  header?: React.ReactNode;
  /** Pinned row below the scrolling body (action buttons etc). */
  footer?: React.ReactNode;
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
  side = "right",
  rightOffset = "var(--space-md)",
  closeOnEscape = true,
  accentColor,
  description,
  header,
  footer,
  bodyClassName,
  isolate = false,
  closeLabel = "Close panel",
}: DrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  // Keep the panel mounted briefly after close so the exit keyframe can play.
  const { shouldRender } = useDelayedClose(open, DRAWER_EXIT_MS);

  // isolate: stop mousedown at the panel NODE, natively. A React
  // onMouseDown={stopPropagation} cannot do this job - App Router hydrates
  // React at the document root, so the synthetic dispatch happens AT
  // document, alongside (and after) useClickOutside's own document
  // listeners; by then a sibling drawer's outside-click has already fired.
  // A native listener on the panel stops the event mid-bubble, before any
  // document listener sees it. (click/focus events are unaffected -
  // only mousedown is stopped, and only while this drawer is rendered.)
  React.useEffect(() => {
    if (!isolate || !shouldRender) return;
    const el = panelRef.current;
    if (!el) return;
    const stop = (e: MouseEvent) => e.stopPropagation();
    el.addEventListener("mousedown", stop);
    return () => el.removeEventListener("mousedown", stop);
  }, [isolate, shouldRender]);

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
  // side="left": anchor off --overlay-left (the mobile shell's own left
  // inset, already 0 below lg) instead of rightOffset - there's no
  // leftOffset counterpart since nothing stacks a second drawer beside a
  // left one today, unlike the right side's TicketDrawer/CleanerPickerDialog.
  const insetStyle: React.CSSProperties =
    side === "left" ? { left: "var(--overlay-left)" } : { right: rightOffset };

  return (
    <>
      {scrim && (
        <div
          data-slot="drawer-scrim"
          style={{
            ...canvasOverlayStyle,
            zIndex: scrimZIndex,
            backgroundColor: "var(--scrim)",
            animation: !open
              ? `fadeOut ${DRAWER_EXIT_MS}ms ease-in forwards`
              : `fadeIn ${DRAWER_EXIT_MS}ms ease-out`,
          }}
          onClick={onClose}
        />
      )}

      {/* Panel - canvas-bounded: top aligns with canvas content top so the
          panel never protrudes into the topnav/submenu. Right (or left, for
          side="left") + bottom inset match canvas content padding from the
          screen edges (below lg, --overlay-bottom clears MobileBottomNav
          instead). */}
      <div
        ref={panelRef}
        data-slot="drawer"
        role="dialog"
        aria-label={title}
        tabIndex={-1}
        className="fixed flex flex-col overflow-hidden rounded-2xl bg-[var(--neutral-30)] shadow-xl"
        style={{
          zIndex,
          top: "calc(var(--overlay-top) + var(--space-md) - 2px)",
          ...insetStyle,
          bottom: "var(--overlay-bottom)",
          width: WIDTHS[width],
          animation: !open
            ? `${frames.out} ${DRAWER_EXIT_MS}ms ease-in forwards`
            : `${frames.in} ${DRAWER_EXIT_MS}ms ease-out`,
        }}
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
            <div>
              <h2 className="text-body text-highlight-10 font-semibold">{title}</h2>
              {description && <p className="text-body text-highlight-10">{description}</p>}
            </div>
            <DrawerCloseButton onClick={onClose} label={closeLabel} />
          </div>
        )}

        <div data-slot="drawer-body" className={cn("p-sm flex-1 overflow-y-auto", bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div
            data-slot="drawer-footer"
            className="gap-base px-sm py-sm flex shrink-0 justify-end border-t"
            style={{ borderColor: "var(--border)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

/** The drawer close-X. Exported for custom `header` slots so they never
    re-roll the recipe. */
function DrawerCloseButton({
  onClick,
  label = "Close panel",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="p-xs text-highlight-10 hover:bg-neutral-30 hover:text-highlight-10 rounded outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
      data-no-elevate
    >
      <X size={18} />
    </button>
  );
}

export { Drawer, DrawerCloseButton };
