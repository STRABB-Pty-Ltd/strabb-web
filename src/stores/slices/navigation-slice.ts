import type { StateCreator } from "zustand";

import type { PageId } from "../types";

export interface NavigationSlice {
  currentPage: PageId;
  previousPage: string | null;
  setCurrentPage: (page: PageId) => void;
}

export const createNavigationSlice: StateCreator<
  NavigationSlice,
  [],
  [],
  NavigationSlice
> = (set, get) => ({
  currentPage: "dashboard",
  previousPage: null,
  setCurrentPage: (page) =>
    set({ currentPage: page, previousPage: get().currentPage }),
});
