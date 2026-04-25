import type { StateCreator } from "zustand";

export interface CalendarPageState {
  view: "gantt" | "calendar" | "list";
  windowSize: string;
  anchor: string | null;
  submenu: string[];
  moreOpen: boolean;
  listSort: string;
  detailItem: string | null;
}

export interface CalendarSlice {
  calendar: CalendarPageState;
  setCalendarListSort: (sort: string) => void;
  setDetailItem: (id: string | null) => void;
}

export const createCalendarSlice: StateCreator<CalendarSlice, [], [], CalendarSlice> = (
  set,
  get,
) => ({
  calendar: {
    view: "gantt",
    windowSize: "fortnight",
    anchor: null,
    submenu: ["overview"],
    moreOpen: false,
    listSort: "date_asc",
    detailItem: null,
  },
  setCalendarListSort: (sort) => set({ calendar: { ...get().calendar, listSort: sort } }),
  setDetailItem: (id) => set({ calendar: { ...get().calendar, detailItem: id } }),
});
