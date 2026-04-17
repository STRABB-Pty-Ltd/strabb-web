import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "../app-store";

describe("AppStore", () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    useAppStore.setState(useAppStore.getInitialState());
  });

  describe("navigation", () => {
    it("setCurrentPage sets currentPage and previousPage", () => {
      expect(useAppStore.getState().currentPage).toBe("dashboard");
      expect(useAppStore.getState().previousPage).toBeNull();

      useAppStore.getState().setCurrentPage("calendar");
      expect(useAppStore.getState().currentPage).toBe("calendar");
      expect(useAppStore.getState().previousPage).toBe("dashboard");

      useAppStore.getState().setCurrentPage("messaging");
      expect(useAppStore.getState().currentPage).toBe("messaging");
      expect(useAppStore.getState().previousPage).toBe("calendar");
    });
  });

  describe("listings", () => {
    it("toggleListing adds and removes from selectedListings", () => {
      useAppStore.getState().toggleListing("lst-001");
      expect(useAppStore.getState().selectedListings).toEqual(["lst-001"]);

      useAppStore.getState().toggleListing("lst-002");
      expect(useAppStore.getState().selectedListings).toEqual(["lst-001", "lst-002"]);

      useAppStore.getState().toggleListing("lst-001");
      expect(useAppStore.getState().selectedListings).toEqual(["lst-002"]);
    });

    it("setSelectedListings replaces the list", () => {
      useAppStore.getState().setSelectedListings(["lst-001", "lst-002", "lst-003"]);
      expect(useAppStore.getState().selectedListings).toEqual(["lst-001", "lst-002", "lst-003"]);
    });

    it("clearListings empties selectedListings", () => {
      useAppStore.getState().setSelectedListings(["lst-001", "lst-002"]);
      useAppStore.getState().clearListings();
      expect(useAppStore.getState().selectedListings).toEqual([]);
    });

    it("selectAllListings via setSelectedListings works", () => {
      const allIds = ["lst-001", "lst-002", "lst-003", "lst-004"];
      useAppStore.getState().setSelectedListings(allIds);
      expect(useAppStore.getState().selectedListings).toEqual(allIds);
    });
  });

  describe("custom groups", () => {
    it("createCustomGroup adds a group", () => {
      useAppStore.getState().createCustomGroup("Beach Properties", ["lst-001", "lst-002"]);
      const groups = useAppStore.getState().customGroups;
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe("Beach Properties");
      expect(groups[0].listingIds).toEqual(["lst-001", "lst-002"]);
    });

    it("deleteCustomGroup removes a group", () => {
      useAppStore.getState().createCustomGroup("Group A", ["lst-001"]);
      useAppStore.getState().createCustomGroup("Group B", ["lst-002"]);
      const groupId = useAppStore.getState().customGroups[0].id;
      useAppStore.getState().deleteCustomGroup(groupId);
      expect(useAppStore.getState().customGroups).toHaveLength(1);
      expect(useAppStore.getState().customGroups[0].name).toBe("Group B");
    });

    it("toggleGroup flips expanded state", () => {
      useAppStore.getState().toggleGroup("grp-1");
      expect(useAppStore.getState().expandedGroups["grp-1"]).toBe(true);
      useAppStore.getState().toggleGroup("grp-1");
      expect(useAppStore.getState().expandedGroups["grp-1"]).toBe(false);
    });
  });

  describe("cross-cutting: submenu chips", () => {
    it("toggleSubmenuChip adds chip when not present", () => {
      useAppStore.getState().toggleSubmenuChip("dashboard", "compare");
      expect(useAppStore.getState().dashboard.submenu).toContain("compare");
    });

    it("toggleSubmenuChip removes chip when present", () => {
      useAppStore.getState().toggleSubmenuChip("dashboard", "compare");
      useAppStore.getState().toggleSubmenuChip("dashboard", "compare");
      expect(useAppStore.getState().dashboard.submenu).not.toContain("compare");
    });

    it("setSubmenu replaces the chip list", () => {
      useAppStore.getState().setSubmenu("calendar", ["bookings", "cleaning"]);
      expect(useAppStore.getState().calendar.submenu).toEqual(["bookings", "cleaning"]);
    });
  });

  describe("cross-cutting: views", () => {
    it("setView updates the correct page view", () => {
      useAppStore.getState().setView("cleaning", "gantt");
      expect(useAppStore.getState().cleaning.view).toBe("gantt");

      useAppStore.getState().setView("calendar", "list");
      expect(useAppStore.getState().calendar.view).toBe("list");

      useAppStore.getState().setView("messaging", "list");
      expect(useAppStore.getState().messaging.view).toBe("list");
    });
  });

  describe("cross-cutting: timeframe", () => {
    it("setTimeframe updates the correct page timeframe", () => {
      useAppStore.getState().setTimeframe("dashboard", "last_month");
      expect(useAppStore.getState().dashboard.timeframe).toBe("last_month");

      useAppStore.getState().setTimeframe("reporting", "this_quarter");
      expect(useAppStore.getState().reporting.timeframe).toBe("this_quarter");
    });
  });

  describe("dashboard", () => {
    it("toggleCompare flips compare flag", () => {
      expect(useAppStore.getState().dashboard.compare).toBe(false);
      useAppStore.getState().toggleCompare();
      expect(useAppStore.getState().dashboard.compare).toBe(true);
      useAppStore.getState().toggleCompare();
      expect(useAppStore.getState().dashboard.compare).toBe(false);
    });

    it("setDrillDown and clearDrillDown manage drillDown state", () => {
      useAppStore.getState().setDrillDown({ type: "revenue", itemId: "lst-001", label: "Revenue" });
      expect(useAppStore.getState().dashboard.drillDown).toEqual({
        type: "revenue",
        itemId: "lst-001",
        label: "Revenue",
      });

      useAppStore.getState().clearDrillDown();
      expect(useAppStore.getState().dashboard.drillDown).toBeNull();
    });
  });

  describe("calendar", () => {
    it("setCalendarListSort updates listSort", () => {
      useAppStore.getState().setCalendarListSort("name_asc");
      expect(useAppStore.getState().calendar.listSort).toBe("name_asc");
    });

    it("setDetailItem updates detailItem", () => {
      useAppStore.getState().setDetailItem("bk-001");
      expect(useAppStore.getState().calendar.detailItem).toBe("bk-001");
    });
  });

  describe("messaging", () => {
    it("setSelectedMessage updates selectedMessage", () => {
      useAppStore.getState().setSelectedMessage("msg-001");
      expect(useAppStore.getState().messaging.selectedMessage).toBe("msg-001");
    });

    it("setThreadMessage updates threadMessage", () => {
      useAppStore.getState().setThreadMessage("msg-001");
      expect(useAppStore.getState().messaging.threadMessage).toBe("msg-001");
    });

    it("toggleChannel adds and removes channels", () => {
      useAppStore.getState().toggleChannel("airbnb");
      expect(useAppStore.getState().messaging.channels).toEqual(["airbnb"]);

      useAppStore.getState().toggleChannel("booking_com");
      expect(useAppStore.getState().messaging.channels).toEqual(["airbnb", "booking_com"]);

      useAppStore.getState().toggleChannel("airbnb");
      expect(useAppStore.getState().messaging.channels).toEqual(["booking_com"]);
    });
  });

  describe("cleaning", () => {
    it("toggleShoppingDrawer flips shoppingDrawerOpen", () => {
      expect(useAppStore.getState().cleaning.shoppingDrawerOpen).toBe(false);
      useAppStore.getState().toggleShoppingDrawer();
      expect(useAppStore.getState().cleaning.shoppingDrawerOpen).toBe(true);
      useAppStore.getState().toggleShoppingDrawer();
      expect(useAppStore.getState().cleaning.shoppingDrawerOpen).toBe(false);
    });

    it("setGanttZoom updates ganttZoom", () => {
      useAppStore.getState().setGanttZoom("day");
      expect(useAppStore.getState().cleaning.ganttZoom).toBe("day");
    });

    it("toggleBoughtItem adds and removes items", () => {
      useAppStore.getState().toggleBoughtItem("si-001");
      expect(useAppStore.getState().cleaning.boughtItems).toEqual(["si-001"]);

      useAppStore.getState().toggleBoughtItem("si-001");
      expect(useAppStore.getState().cleaning.boughtItems).toEqual([]);
    });
  });

  describe("reporting", () => {
    it("toggleSavedReports flips savedReportsOpen", () => {
      expect(useAppStore.getState().reporting.savedReportsOpen).toBe(false);
      useAppStore.getState().toggleSavedReports();
      expect(useAppStore.getState().reporting.savedReportsOpen).toBe(true);
    });

    it("addSavedReport and deleteSavedReport manage reports", () => {
      useAppStore.getState().addSavedReport({
        id: "sr-001",
        name: "Monthly Revenue",
        timeframe: "this_month",
        submenu: ["overview"],
        createdAt: "2026-04-01",
      });
      expect(useAppStore.getState().reporting.savedReports).toHaveLength(1);

      useAppStore.getState().deleteSavedReport("sr-001");
      expect(useAppStore.getState().reporting.savedReports).toHaveLength(0);
    });

    it("setActiveSavedReport sets active report", () => {
      useAppStore.getState().setActiveSavedReport("sr-001");
      expect(useAppStore.getState().reporting.activeSavedReport).toBe("sr-001");
    });
  });

  describe("settings", () => {
    it("setSection updates the section", () => {
      useAppStore.getState().setSection("billing");
      expect(useAppStore.getState().settings.section).toBe("billing");
    });
  });

  describe("overlay", () => {
    it("openTimeframePopup and closeTimeframePopup manage tfPopup", () => {
      useAppStore.getState().openTimeframePopup();
      expect(useAppStore.getState().tfPopup.open).toBe(true);

      useAppStore.getState().closeTimeframePopup();
      expect(useAppStore.getState().tfPopup.open).toBe(false);
    });

    it("setCustomRange updates custom range", () => {
      useAppStore.getState().setCustomRange({ start: "2026-04-01", end: "2026-04-30" });
      expect(useAppStore.getState().customRange).toEqual({
        start: "2026-04-01",
        end: "2026-04-30",
      });
    });

    it("setShareFields updates share fields", () => {
      useAppStore.getState().setShareFields({ revenue: true, occupancy: false });
      expect(useAppStore.getState().shareFields).toEqual({
        revenue: true,
        occupancy: false,
      });
    });

    it("openThreadOverlay and closeThreadOverlay manage thread state", () => {
      useAppStore.getState().openThreadOverlay("msg-001");
      expect(useAppStore.getState().threadOverlay).toEqual({
        open: true,
        messageId: "msg-001",
      });

      useAppStore.getState().closeThreadOverlay();
      expect(useAppStore.getState().threadOverlay).toBeNull();
    });

    it("drillDownPanel open and close", () => {
      useAppStore.getState().openDrillDownPanel("revenue", "lst-001");
      expect(useAppStore.getState().drillDownPanel).toEqual({
        open: true,
        type: "revenue",
        itemId: "lst-001",
      });

      useAppStore.getState().closeDrillDownPanel();
      expect(useAppStore.getState().drillDownPanel).toBeNull();
    });

    it("addToast and removeToast manage toasts", () => {
      useAppStore.getState().addToast({ type: "success", message: "Done!" });
      const toasts = useAppStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe("Done!");

      useAppStore.getState().removeToast(toasts[0].id);
      expect(useAppStore.getState().toasts).toHaveLength(0);
    });
  });
});
