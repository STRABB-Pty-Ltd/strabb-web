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
      // Dialogs (ConfirmDialog etc.) and TimeframePopup render as siblings
      // in the tree, not DOM descendants of the panel that opened them, so
      // a click on one is outside the panel's DOM even when it was opened
      // FROM the panel. Without this guard the panel closes mid-click -
      // unmounting a ConfirmDialog and swallowing the confirm action, or
      // (M.3) closing MobileNavDrawer the instant the user touches the
      // timeframe popup it just opened, e.g. just paging months.
      const target = e.target as Element | null;
      if (
        target?.closest?.(
          '[data-slot="dialog-content"], [data-slot="dialog-overlay"], [data-slot="timeframe-popup"]',
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
