import type { StateCreator } from "zustand";

export interface SettingsPageState {
  section: string;
}

export interface SettingsSlice {
  settings: SettingsPageState;
  setSection: (section: string) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (set) => ({
  settings: {
    section: "general",
  },
  setSection: (section) => set({ settings: { section } }),
});
