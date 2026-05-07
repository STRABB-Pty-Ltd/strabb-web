import type { CSSProperties } from "react";

/**
 * Inline style equivalent of the legacy `.canvas-overlay` CSS class.
 * Positions an overlay scrim or centred modal so it covers the entire
 * canvas region flush to its bounds - the sidebar, top nav, and
 * submenu bar stay uncovered and interactive.
 *
 * Values are literal/single-var rather than nested calc chains:
 * stacked var()s inside a calc() applied via React inline style
 * (style={{ top: "calc(...)" }}) silently failed to resolve in the
 * dev build, leaving overlays 0×0 and invisible. Single var or
 * numeric value per property avoids the resolution hazard.
 *
 * The constants mirror the design tokens at their currently-locked
 * values:
 *   top    = --canvas-top (~114px)
 *   right  = 0  (viewport edge)
 *   bottom = 0
 *   left   = --sidebar-width (16vw)
 * Update these together with the underlying tokens.
 */
export const canvasOverlayStyle: CSSProperties = {
  position: "fixed",
  top: 114,
  right: 0,
  bottom: 0,
  left: "var(--sidebar-width)",
};
