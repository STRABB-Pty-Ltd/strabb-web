import type { StateCreator } from "zustand";

export interface OperationsPageState {
  view: "kanban" | "list";
  windowSize: string;
  anchor: string | null;
  submenu: string[];
  moreOpen: boolean;
  listSort: string;
  shoppingDrawerOpen: boolean;
  boughtItems: string[];
}

export interface OperationsSlice {
  operations: OperationsPageState;
  setOperationsListSort: (sort: string) => void;
  toggleShoppingDrawer: () => void;
  toggleBoughtItem: (id: string) => void;
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
    boughtItems: [],
  },
  setOperationsListSort: (sort) => set({ operations: { ...get().operations, listSort: sort } }),
  toggleShoppingDrawer: () =>
    set({
      operations: {
        ...get().operations,
        shoppingDrawerOpen: !get().operations.shoppingDrawerOpen,
      },
    }),
  toggleBoughtItem: (id) => {
    const current = get().operations.boughtItems;
    set({
      operations: {
        ...get().operations,
        boughtItems: current.includes(id) ? current.filter((i) => i !== id) : [...current, id],
      },
    });
  },
});
