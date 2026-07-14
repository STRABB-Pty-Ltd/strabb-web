import type { CSSProperties } from "react";

/**
 * Inline style equivalent of the legacy `.canvas-overlay` CSS class.
 * Positions an overlay scrim or centred modal so it covers the entire
 * canvas region flush to its bounds - the sidebar, top nav, and
 * submenu bar stay uncovered and interactive (desktop); below lg,
 * covers the mobile shell's canvas instead (see --overlay-* in
 * globals.css - MobileTopBar/MobileBottomNav replace the sidebar rail
 * there, M.1).
 *
 * Values are literal/single-var rather than nested calc chains:
 * stacked var()s inside a calc() applied via React inline style
 * (style={{ top: "calc(...)" }}) silently failed to resolve in the
 * dev build, leaving overlays 0×0 and invisible. Single var or
 * numeric value per property avoids the resolution hazard - the
 * responsive part of --overlay-top/--overlay-left lives in a plain CSS
 * media query in globals.css, not in this inline style.
 *
 *   top    = --overlay-top (desktop ~114px / mobile ~72px)
 *   right  = 0  (viewport edge)
 *   bottom = 0
 *   left   = --overlay-left (desktop --sidebar-width / mobile 0)
 * Update these together with the underlying tokens.
 */
export const canvasOverlayStyle: CSSProperties = {
  position: "fixed",
  top: "var(--overlay-top)",
  right: 0,
  bottom: 0,
  left: "var(--overlay-left)",
};
