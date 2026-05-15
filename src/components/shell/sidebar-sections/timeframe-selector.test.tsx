import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { setTimeframeMock, openTimeframePopupMock } = vi.hoisted(() => ({
  setTimeframeMock: vi.fn(),
  openTimeframePopupMock: vi.fn(),
}));

const storeState = {
  setTimeframe: setTimeframeMock,
  openTimeframePopup: openTimeframePopupMock,
  dashboard: { windowSize: "month" },
  calendar: { windowSize: "month" },
  operations: { windowSize: "week" },
  reporting: { windowSize: "month" },
};

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

import { TimeframeSelector } from "./timeframe-selector";

describe("TimeframeSelector", () => {
  beforeEach(() => {
    setTimeframeMock.mockReset();
    openTimeframePopupMock.mockReset();
  });
  afterEach(() => {
    storeState.dashboard.windowSize = "month";
    storeState.calendar.windowSize = "month";
    storeState.operations.windowSize = "week";
    storeState.reporting.windowSize = "month";
  });

  it("default windowSize is highlighted on first render", () => {
    storeState.dashboard.windowSize = "month";
    render(<TimeframeSelector page="dashboard" />);
    const monthBtn = screen.getByRole("button", { name: "Month" });
    expect(monthBtn).toHaveStyle({ backgroundColor: "var(--highlight-10)" });
  });

  it("clicking a non-active chip sets timeframe AND opens popup with autoSelect=true", async () => {
    storeState.dashboard.windowSize = "month";
    render(<TimeframeSelector page="dashboard" />);
    await userEvent.click(screen.getByRole("button", { name: "Quarter" }));
    expect(setTimeframeMock).toHaveBeenCalledWith("dashboard", "quarter", null);
    expect(openTimeframePopupMock).toHaveBeenCalledWith(
      expect.objectContaining({ autoSelect: true }),
    );
  });

  it("clicking the already-active chip opens popup with autoSelect=false", async () => {
    storeState.dashboard.windowSize = "month";
    render(<TimeframeSelector page="dashboard" />);
    await userEvent.click(screen.getByRole("button", { name: "Month" }));
    expect(openTimeframePopupMock).toHaveBeenCalledWith(
      expect.objectContaining({ autoSelect: false }),
    );
  });

  it("cleaning's 'Today' chip maps to windowSize 'day'", async () => {
    render(<TimeframeSelector page="operations" />);
    await userEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(setTimeframeMock).toHaveBeenCalledWith("operations", "day", null);
  });

  it("Custom button sets windowSize=custom and opens the popup", async () => {
    render(<TimeframeSelector page="dashboard" />);
    await userEvent.click(screen.getByRole("button", { name: "Custom" }));
    expect(setTimeframeMock).toHaveBeenCalledWith("dashboard", "custom", null);
    expect(openTimeframePopupMock).toHaveBeenCalled();
  });
});
