import type { StateCreator } from "zustand";

import type { CustomGroup } from "../types";

export interface ListingsSlice {
  selectedListings: string[];
  expandedGroups: Record<string, boolean>;
  customGroups: CustomGroup[];
  setSelectedListings: (ids: string[]) => void;
  toggleListing: (id: string) => void;
  selectAllListings: () => void;
  clearListings: () => void;
  toggleGroup: (groupId: string) => void;
  createCustomGroup: (name: string, listingIds: string[]) => void;
  deleteCustomGroup: (id: string) => void;
}

let groupCounter = 0;

export const createListingsSlice: StateCreator<ListingsSlice, [], [], ListingsSlice> = (
  set,
  get,
) => ({
  selectedListings: [],
  expandedGroups: {},
  customGroups: [],
  setSelectedListings: (ids) => set({ selectedListings: ids }),
  toggleListing: (id) => {
    const current = get().selectedListings;
    set({
      selectedListings: current.includes(id)
        ? current.filter((lid) => lid !== id)
        : [...current, id],
    });
  },
  selectAllListings: () => {
    // Populated by the component that knows the full listing set
    // This is a no-op at store level - consumers call setSelectedListings with the full list
    // Keeping this action for API consistency; components pass all IDs via setSelectedListings
  },
  clearListings: () => set({ selectedListings: [] }),
  toggleGroup: (groupId) => {
    const expanded = get().expandedGroups;
    set({
      expandedGroups: { ...expanded, [groupId]: !expanded[groupId] },
    });
  },
  createCustomGroup: (name, listingIds) => {
    const id = `group-${++groupCounter}`;
    set({
      customGroups: [...get().customGroups, { id, name, listingIds }],
    });
  },
  deleteCustomGroup: (id) =>
    set({
      customGroups: get().customGroups.filter((g) => g.id !== id),
    }),
});
