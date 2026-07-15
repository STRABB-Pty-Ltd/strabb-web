import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  pushMock,
  closeDrillDownPanelMock,
  closeThreadOverlayMock,
  closeSharePopupMock,
  closeShoppingListPopupMock,
  closeTimeframePopupMock,
  closeMobileNavDrawerMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  closeDrillDownPanelMock: vi.fn(),
  closeThreadOverlayMock: vi.fn(),
  closeSharePopupMock: vi.fn(),
  closeShoppingListPopupMock: vi.fn(),
  closeTimeframePopupMock: vi.fn(),
  closeMobileNavDrawerMock: vi.fn(),
}));

const storeState = {
  setCurrentPage: vi.fn(),
  closeDrillDownPanel: closeDrillDownPanelMock,
  closeThreadOverlay: closeThreadOverlayMock,
  closeSharePopup: closeSharePopupMock,
  closeShoppingListPopup: closeShoppingListPopupMock,
  closeTimeframePopup: closeTimeframePopupMock,
  closeMobileNavDrawer: closeMobileNavDrawerMock,
  drillDownPanel: null as { open: boolean } | null,
  threadOverlay: null as { open: boolean } | null,
  sharePopup: { open: false },
  shoppingListPopup: { open: false },
  tfPopup: { open: false },
  mobileNavDrawer: { open: false },
};

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const { useKeyboardShortcuts } = await import("./use-keyboard-shortcuts");

function pressEscape() {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  });
}

describe("useKeyboardShortcuts - Escape priority chain", () => {
  beforeEach(() => {
    pushMock.mockReset();
    closeDrillDownPanelMock.mockReset();
    closeThreadOverlayMock.mockReset();
    closeSharePopupMock.mockReset();
    closeShoppingListPopupMock.mockReset();
    closeTimeframePopupMock.mockReset();
    closeMobileNavDrawerMock.mockReset();
    storeState.drillDownPanel = null;
    storeState.threadOverlay = null;
    storeState.sharePopup = { open: false };
    storeState.shoppingListPopup = { open: false };
    storeState.tfPopup = { open: false };
    storeState.mobileNavDrawer = { open: false };
  });

  it("closes the mobile nav drawer on Escape when it's the only thing open", () => {
    storeState.mobileNavDrawer = { open: true };
    renderHook(() => useKeyboardShortcuts());
    pressEscape();
    expect(closeMobileNavDrawerMock).toHaveBeenCalledTimes(1);
  });

  it("does nothing on Escape when the drawer is closed and nothing else is open", () => {
    renderHook(() => useKeyboardShortcuts());
    pressEscape();
    expect(closeMobileNavDrawerMock).not.toHaveBeenCalled();
  });

  it("prioritises TimeframePopup over the drawer - a popup opened from inside the drawer closes first", () => {
    storeState.mobileNavDrawer = { open: true };
    storeState.tfPopup = { open: true };
    renderHook(() => useKeyboardShortcuts());
    pressEscape();
    expect(closeTimeframePopupMock).toHaveBeenCalledTimes(1);
    expect(closeMobileNavDrawerMock).not.toHaveBeenCalled();
  });

  it("still prioritises drillDownPanel above everything, including the drawer", () => {
    storeState.mobileNavDrawer = { open: true };
    storeState.drillDownPanel = { open: true };
    renderHook(() => useKeyboardShortcuts());
    pressEscape();
    expect(closeDrillDownPanelMock).toHaveBeenCalledTimes(1);
    expect(closeMobileNavDrawerMock).not.toHaveBeenCalled();
  });
});
