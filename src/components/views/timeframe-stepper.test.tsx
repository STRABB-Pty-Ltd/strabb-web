import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { setTimeframeAnchorMock, openTimeframePopupMock } = vi.hoisted(() => ({
  setTimeframeAnchorMock: vi.fn(),
  openTimeframePopupMock: vi.fn(),
}));

const storeState = {
  currentPage: "dashboard" as
    | "dashboard"
    | "calendar"
    | "cleaning"
    | "reporting"
    | "messaging"
    | "settings",
  setTimeframeAnchor: setTimeframeAnchorMock,
  openTimeframePopup: openTimeframePopupMock,
  dashboard: { windowSize: "month", anchor: null as string | null },
  calendar: { windowSize: "week", anchor: null as string | null },
  cleaning: { windowSize: "week", anchor: null as string | null },
  reporting: { windowSize: "month", anchor: null as string | null },
  customRange: null as { start: string; end: string } | null,
};

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

import { TimeframeStepper } from "./timeframe-stepper";

describe("TimeframeStepper", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      now: new Date(2026, 3, 15),
    });
    setTimeframeAnchorMock.mockReset();
    openTimeframePopupMock.mockReset();
    storeState.currentPage = "dashboard";
    storeState.dashboard = { windowSize: "month", anchor: null };
    storeState.customRange = null;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing on a page without timeframe (messaging)", () => {
    storeState.currentPage = "messaging";
    const { container } = render(<TimeframeStepper />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders current period label by default", () => {
    render(<TimeframeStepper />);
    expect(screen.getByRole("button", { name: "April 2026" })).toBeInTheDocument();
  });

  it("clicking next steps anchor by one windowSize unit", async () => {
    render(<TimeframeStepper />);
    await userEvent.click(screen.getByRole("button", { name: /next period/i }));
    expect(setTimeframeAnchorMock).toHaveBeenCalledWith("dashboard", "2026-05-01");
  });

  it("clicking previous steps anchor backward", async () => {
    render(<TimeframeStepper />);
    await userEvent.click(screen.getByRole("button", { name: /previous period/i }));
    expect(setTimeframeAnchorMock).toHaveBeenCalledWith("dashboard", "2026-03-01");
  });

  it("clicking the label opens the popup", async () => {
    render(<TimeframeStepper />);
    await userEvent.click(screen.getByRole("button", { name: "April 2026" }));
    expect(openTimeframePopupMock).toHaveBeenCalled();
  });

  it("hides chevrons for ytd", () => {
    storeState.dashboard = { windowSize: "ytd", anchor: null };
    render(<TimeframeStepper />);
    expect(screen.queryByRole("button", { name: /next period/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /previous period/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Year to date" })).toBeInTheDocument();
  });

  it("hides chevrons for custom and shows custom range label", () => {
    storeState.dashboard = { windowSize: "custom", anchor: null };
    storeState.customRange = { start: "2026-02-10", end: "2026-03-20" };
    render(<TimeframeStepper />);
    expect(screen.queryByRole("button", { name: /next period/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /10 Feb 2026 – 20 Mar 2026/ })).toBeInTheDocument();
  });
});
