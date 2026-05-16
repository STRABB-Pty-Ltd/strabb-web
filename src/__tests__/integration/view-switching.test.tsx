import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "@/stores/app-store";

describe("View switching integration", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  describe("Calendar page", () => {
    it("defaults to gantt view", () => {
      expect(useAppStore.getState().calendar.view).toBe("gantt");
    });

    it("switching to calendar view works", () => {
      useAppStore.getState().setView("calendar", "calendar");
      expect(useAppStore.getState().calendar.view).toBe("calendar");
    });

    it("switching to list view works", () => {
      useAppStore.getState().setView("calendar", "list");
      expect(useAppStore.getState().calendar.view).toBe("list");
    });

    it("switching back to gantt view works", () => {
      useAppStore.getState().setView("calendar", "list");
      useAppStore.getState().setView("calendar", "gantt");
      expect(useAppStore.getState().calendar.view).toBe("gantt");
    });
  });

  describe("Messaging page", () => {
    it("defaults to kanban view", () => {
      expect(useAppStore.getState().messaging.view).toBe("kanban");
    });

    it("switching to list view works", () => {
      useAppStore.getState().setView("messaging", "list");
      expect(useAppStore.getState().messaging.view).toBe("list");
    });

    it("switching back to kanban view works", () => {
      useAppStore.getState().setView("messaging", "list");
      useAppStore.getState().setView("messaging", "kanban");
      expect(useAppStore.getState().messaging.view).toBe("kanban");
    });
  });

  describe("Cleaning page", () => {
    it("defaults to kanban view", () => {
      expect(useAppStore.getState().operations.view).toBe("kanban");
    });

    it("switching to calendar view works", () => {
      useAppStore.getState().setView("operations", "calendar");
      expect(useAppStore.getState().operations.view).toBe("calendar");
    });

    it("switching to list view works", () => {
      useAppStore.getState().setView("operations", "list");
      expect(useAppStore.getState().operations.view).toBe("list");
    });

    it("switching back to kanban view works", () => {
      useAppStore.getState().setView("operations", "list");
      useAppStore.getState().setView("operations", "kanban");
      expect(useAppStore.getState().operations.view).toBe("kanban");
    });
  });

  describe("View independence", () => {
    it("changing calendar view does not affect cleaning view", () => {
      useAppStore.getState().setView("calendar", "list");
      expect(useAppStore.getState().operations.view).toBe("kanban");
    });

    it("changing messaging view does not affect calendar view", () => {
      useAppStore.getState().setView("messaging", "list");
      expect(useAppStore.getState().calendar.view).toBe("gantt");
    });
  });
});
