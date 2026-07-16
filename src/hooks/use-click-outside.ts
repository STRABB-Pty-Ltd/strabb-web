"use client";

import { useEffect, type RefObject } from "react";

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onClose: () => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;
    function handler(e: MouseEvent) {
      const el = ref.current;
      if (!el || el.contains(e.target as Node)) return;
      // Dialogs (ConfirmDialog etc.), TimeframePopup, and MobileNavDrawer's
      // own hamburger trigger render as siblings in the tree, not DOM
      // descendants of the panel that opened them, so a click on one is
      // outside the panel's DOM even when it was opened FROM the panel (or,
      // for the trigger, toggles it). Without this guard the panel closes
      // mid-click - unmounting a ConfirmDialog and swallowing the confirm
      // action, closing MobileNavDrawer the instant the user touches the
      // timeframe popup it just opened (M.3), or - the trigger case - firing
      // this handler's onClose on mousedown a beat before the trigger's own
      // onClick reads a now-stale "was open" flag and reopens it right back
      // (the same close-then-reopen race NotificationsDropdown hit before
      // it scoped its own click-outside to include its trigger).
      const target = e.target as Element | null;
      if (
        target?.closest?.(
          '[data-slot="dialog-content"], [data-slot="dialog-overlay"], [data-slot="timeframe-popup"], [data-slot="mobile-nav-trigger"]',
        )
      ) {
        return;
      }
      onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose, enabled]);
}
