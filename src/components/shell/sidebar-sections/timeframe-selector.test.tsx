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
  cleaning: { windowSize: "week" },
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
    storeState.cleaning.windowSize = "week";
    storeState.reporting.windowSize = "month";
  });

  it("dashboard chip set: Month / Quarter / YTD / Year", () => {
    render(<TimeframeSelector page="dashboard" />);
    expect(screen.getByRole("button", { name: "Month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quarter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "YTD" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Year" })).toBeInTheDocument();
  });

  it("default windowSize is highlighted on first render", () => {
    storeState.dashboard.windowSize = "month";
    render(<TimeframeSelector page="dashboard" />);
    const monthBtn = screen.getByRole("button", { name: "Month" });
    expect(monthBtn).toHaveStyle({ backgroundColor: "var(--btn-active-bg)" });
  });

  it("clicking a non-active chip sets timeframe AND opens popup with autoSelect=true", async () => {
    storeState.dashboard.windowSize = "month";
    render(<TimeframeSelector page="dashboard" />);
    await userEvent.click(screen.getByRole("button", { name: "Quarter" }));
    expect(setTimeframeMock).toHaveBeenCalledWith("dashboard", "quarter", null);
    expect(openTimeframePopupMock).toHaveBeenCalledWith(true);
  });

  it("clicking the already-active chip opens popup with autoSelect=false", async () => {
    storeState.dashboard.windowSize = "month";
    render(<TimeframeSelector page="dashboard" />);
    await userEvent.click(screen.getByRole("button", { name: "Month" }));
    expect(openTimeframePopupMock).toHaveBeenCalledWith(false);
  });

  it("cleaning's 'Today' chip maps to windowSize 'day'", async () => {
    render(<TimeframeSelector page="cleaning" />);
    await userEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(setTimeframeMock).toHaveBeenCalledWith("cleaning", "day", null);
  });

  it("Custom button sets windowSize=custom and opens the popup", async () => {
    render(<TimeframeSelector page="dashboard" />);
    await userEvent.click(screen.getByRole("button", { name: "Custom" }));
    expect(setTimeframeMock).toHaveBeenCalledWith("dashboard", "custom", null);
    expect(openTimeframePopupMock).toHaveBeenCalled();
  });
});
