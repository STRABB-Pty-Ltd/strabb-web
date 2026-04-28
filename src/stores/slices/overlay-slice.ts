import type { StateCreator } from "zustand";

import type { Toast } from "../types";

/** Bounding-rect snapshot of the element that opened the timeframe popup, so
 *  the popup can position itself directly below its trigger. Stored as a
 *  plain object (not DOMRect) for zustand. Null = no specific anchor; the
 *  popup falls back to its legacy fixed-position spot. */
export interface TimeframePopupAnchor {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface OverlayState {
  calendarDate: Date;
  tfPopup: { open: boolean; anchor: TimeframePopupAnchor | null; autoSelect: boolean };
  customRange: { start: string; end: string } | null;
  shareFields: Record<string, boolean>;
  drillDownPanel: { open: boolean; type: string; itemId: string } | null;
  threadOverlay: { open: boolean; messageId: string } | null;
  sharePopup: { open: boolean };
  shoppingListPopup: { open: boolean };
  toasts: Toast[];
}

export interface OverlaySlice extends OverlayState {
  openTimeframePopup: (opts?: {
    autoSelect?: boolean;
    anchor?: TimeframePopupAnchor | null;
  }) => void;
  closeTimeframePopup: () => void;
  setCustomRange: (range: { start: string; end: string } | null) => void;
  setShareFields: (fields: Record<string, boolean>) => void;
  openDrillDownPanel: (type: string, itemId: string) => void;
  closeDrillDownPanel: () => void;
  openThreadOverlay: (messageId: string) => void;
  closeThreadOverlay: () => void;
  openSharePopup: () => void;
  closeSharePopup: () => void;
  openShoppingListPopup: () => void;
  closeShoppingListPopup: () => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

let toastCounter = 0;

export const createOverlaySlice: StateCreator<OverlaySlice, [], [], OverlaySlice> = (set, get) => ({
  calendarDate: new Date(),
  tfPopup: { open: false, anchor: null, autoSelect: false },
  customRange: null,
  shareFields: {},
  drillDownPanel: null,
  threadOverlay: null,
  sharePopup: { open: false },
  shoppingListPopup: { open: false },
  toasts: [],
  openTimeframePopup: (opts = {}) =>
    set({
      tfPopup: {
        open: true,
        anchor: opts.anchor ?? null,
        autoSelect: opts.autoSelect ?? false,
      },
    }),
  closeTimeframePopup: () => set({ tfPopup: { open: false, anchor: null, autoSelect: false } }),
  setCustomRange: (range) => set({ customRange: range }),
  setShareFields: (fields) => set({ shareFields: fields }),
  openDrillDownPanel: (type, itemId) => set({ drillDownPanel: { open: true, type, itemId } }),
  closeDrillDownPanel: () => set({ drillDownPanel: null }),
  openThreadOverlay: (messageId) => set({ threadOverlay: { open: true, messageId } }),
  closeThreadOverlay: () => set({ threadOverlay: null }),
  openSharePopup: () => set({ sharePopup: { open: true } }),
  closeSharePopup: () => set({ sharePopup: { open: false } }),
  openShoppingListPopup: () => set({ shoppingListPopup: { open: true } }),
  closeShoppingListPopup: () => set({ shoppingListPopup: { open: false } }),
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set({ toasts: [...get().toasts, { ...toast, id }] });
  },
  removeToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
});
