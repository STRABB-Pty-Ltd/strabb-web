import type { StateCreator } from "zustand";

export interface CleaningPageState {
  view: "kanban" | "calendar" | "list" | "gantt";
  timeframe: string;
  submenu: string[];
  moreOpen: boolean;
  listSort: string;
  ganttZoom: "day" | "week" | "month";
  shoppingDrawerOpen: boolean;
  boughtItems: string[];
}

export interface CleaningSlice {
  cleaning: CleaningPageState;
  setCleaningListSort: (sort: string) => void;
  setGanttZoom: (zoom: "day" | "week" | "month") => void;
  toggleShoppingDrawer: () => void;
  toggleBoughtItem: (id: string) => void;
}

export const createCleaningSlice: StateCreator<CleaningSlice, [], [], CleaningSlice> = (
  set,
  get,
) => ({
  cleaning: {
    view: "kanban",
    timeframe: "this_week",
    submenu: ["overview"],
    moreOpen: false,
    listSort: "date_asc",
    ganttZoom: "week",
    shoppingDrawerOpen: false,
    boughtItems: [],
  },
  setCleaningListSort: (sort) => set({ cleaning: { ...get().cleaning, listSort: sort } }),
  setGanttZoom: (zoom) => set({ cleaning: { ...get().cleaning, ganttZoom: zoom } }),
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
