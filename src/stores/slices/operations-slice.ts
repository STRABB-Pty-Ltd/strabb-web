import type { StateCreator } from "zustand";

export interface OperationsPageState {
  view: "kanban" | "list";
  windowSize: string;
  anchor: string | null;
  submenu: string[];
  moreOpen: boolean;
  listSort: string;
  shoppingDrawerOpen: boolean;
}

export interface OperationsSlice {
  operations: OperationsPageState;
  setOperationsListSort: (sort: string) => void;
  toggleShoppingDrawer: () => void;
}

export const createOperationsSlice: StateCreator<OperationsSlice, [], [], OperationsSlice> = (
  set,
  get,
) => ({
  operations: {
    view: "kanban",
    windowSize: "week",
    anchor: null,
    submenu: ["overview"],
    moreOpen: false,
    listSort: "date_asc",
    shoppingDrawerOpen: false,
  },
  setOperationsListSort: (sort) => set({ operations: { ...get().operations, listSort: sort } }),
  toggleShoppingDrawer: () =>
    set({
      operations: {
        ...get().operations,
        shoppingDrawerOpen: !get().operations.shoppingDrawerOpen,
      },
    }),
});
