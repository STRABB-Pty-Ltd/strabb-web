import type { StateCreator } from "zustand";

import type { Toast } from "../types";

export interface OverlayState {
  calendarDate: Date;
  tfPopup: { open: boolean; anchor: "sidebar" };
  customRange: { start: string; end: string } | null;
  shareFields: Record<string, boolean>;
  drillDownPanel: { open: boolean; type: string; itemId: string } | null;
  threadOverlay: { open: boolean; messageId: string } | null;
  sharePopup: { open: boolean };
  shoppingListPopup: { open: boolean };
  toasts: Toast[];
}

export interface OverlaySlice extends OverlayState {
  openTimeframePopup: () => void;
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
  tfPopup: { open: false, anchor: "sidebar" },
  customRange: null,
  shareFields: {},
  drillDownPanel: null,
  threadOverlay: null,
  sharePopup: { open: false },
  shoppingListPopup: { open: false },
  toasts: [],
  openTimeframePopup: () => set({ tfPopup: { open: true, anchor: "sidebar" } }),
  closeTimeframePopup: () => set({ tfPopup: { open: false, anchor: "sidebar" } }),
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
