import type { StateCreator } from "zustand";

export interface CleaningPageState {
  view: "kanban" | "calendar" | "list";
  windowSize: string;
  anchor: string | null;
  submenu: string[];
  moreOpen: boolean;
  listSort: string;
  shoppingDrawerOpen: boolean;
  boughtItems: string[];
}

export interface CleaningSlice {
  cleaning: CleaningPageState;
  setCleaningListSort: (sort: string) => void;
  toggleShoppingDrawer: () => void;
  toggleBoughtItem: (id: string) => void;
}

export const createCleaningSlice: StateCreator<CleaningSlice, [], [], CleaningSlice> = (
  set,
  get,
) => ({
  cleaning: {
    view: "kanban",
    windowSize: "week",
    anchor: null,
    submenu: ["overview"],
    moreOpen: false,
    listSort: "date_asc",
    shoppingDrawerOpen: false,
    boughtItems: [],
  },
  setCleaningListSort: (sort) => set({ cleaning: { ...get().cleaning, listSort: sort } }),
  toggleShoppingDrawer: () =>
    set({
      cleaning: {
        ...get().cleaning,
        shoppingDrawerOpen: !get().cleaning.shoppingDrawerOpen,
      },
    }),
  toggleBoughtItem: (id) => {
    const current = get().cleaning.boughtItems;
    set({
      cleaning: {
        ...get().cleaning,
        boughtItems: current.includes(id) ? current.filter((i) => i !== id) : [...current, id],
      },
    });
  },
});
