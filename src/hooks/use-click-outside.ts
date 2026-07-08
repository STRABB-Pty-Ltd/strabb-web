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
      // Dialogs (ConfirmDialog etc.) portal to document.body, so a click on
      // one is outside the panel's DOM even when it was opened FROM the
      // panel. Without this guard the panel closes and unmounts the dialog
      // mid-click, swallowing the confirm action.
      const target = e.target as Element | null;
      if (target?.closest?.('[data-slot="dialog-content"], [data-slot="dialog-overlay"]')) {
        return;
      }
      onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose, enabled]);
}
