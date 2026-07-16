/**
 * Centralised z-index scale for STRABB overlays. Higher number = closer
 * to the viewer.
 *
 * Stack, low to high:
 * - DRAWER (drill-down panels, side drawers incl. MobileNavDrawer)
 * - THREAD (conversation overlay; timeframe-popup - both sit above drawers,
 *   timeframe-popup needs to since M.3's MobileNavDrawer can open it as a
 *   nested popup from inside an already-open drawer)
 * - MODAL (centre-screen popups: share, shopping-list)
 * - SKIP_LINK (keyboard a11y; always on top)
 *
 * Each content layer has a paired SCRIM 5-10 below it.
 *
 * Notes:
 * - shadcn Dialog uses Tailwind's z-50 (~50). It lives in a separate
 *   stack from this overlay tree. Don't mix; if a shadcn Dialog needs
 *   to layer above our drawers, route it through ConfirmDialog or move
 *   it into one of these layers explicitly.
 * - Numbers are non-contiguous on purpose: gaps leave room for future
 *   sub-layers without renumbering everything.
 */
export const Z = {
  DRAWER_SCRIM: 140,
  DRAWER: 150,
  THREAD_SCRIM: 170,
  THREAD: 175,
  MODAL_SCRIM: 180,
  MODAL: 185,
  SKIP_LINK: 1000,
} as const;
