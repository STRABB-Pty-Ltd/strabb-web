import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { closeMock, setAnchorMock, setCustomRangeMock } = vi.hoisted(() => ({
  closeMock: vi.fn(),
  setAnchorMock: vi.fn(),
  setCustomRangeMock: vi.fn(),
}));

const storeState = {
  tfPopup: { open: true, anchor: "sidebar", autoSelect: false } as {
    open: boolean;
    anchor: "sidebar";
    autoSelect: boolean;
  },
  closeTimeframePopup: closeMock,
  setTimeframeAnchor: setAnchorMock,
  setCustomRange: setCustomRangeMock,
  customRange: null as { start: string; end: string } | null,
  currentPage: "dashboard" as
    | "dashboard"
    | "calendar"
    | "cleaning"
    | "reporting"
    | "messaging"
    | "settings",
  dashboard: { windowSize: "month", anchor: null as string | null },
  calendar: { windowSize: "week", anchor: null as string | null },
  cleaning: { windowSize: "week", anchor: null as string | null },
  reporting: { windowSize: "month", anchor: null as string | null },
};

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

import { TimeframePopup } from "./timeframe-popup";

describe("TimeframePopup", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      now: new Date(2026, 3, 15),
    });
    closeMock.mockReset();
    setAnchorMock.mockReset();
    setCustomRangeMock.mockReset();
    storeState.tfPopup = { open: true, anchor: "sidebar", autoSelect: false };
    storeState.currentPage = "dashboard";
    storeState.dashboard = { windowSize: "month", anchor: null };
    storeState.customRange = null;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when closed", () => {
    storeState.tfPopup = { open: false, anchor: "sidebar", autoSelect: false };
    const { container } = render(<TimeframePopup />);
    expect(container).toBeEmptyDOMElement();
  });

  it("autoSelect=true renders the progress bar", () => {
    storeState.tfPopup = { open: true, anchor: "sidebar", autoSelect: true };
    storeState.dashboard = { windowSize: "month", anchor: null };
    render(<TimeframePopup />);
    expect(screen.getByLabelText(/auto-confirming current period/i)).toBeInTheDocument();
  });

  it("autoSelect=false hides the progress bar", () => {
    storeState.tfPopup = { open: true, anchor: "sidebar", autoSelect: false };
    storeState.dashboard = { windowSize: "month", anchor: null };
    render(<TimeframePopup />);
    expect(screen.queryByLabelText(/auto-confirming/i)).not.toBeInTheDocument();
  });

  it("autoSelect timer auto-closes after 7 seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 15));
    storeState.tfPopup = { open: true, anchor: "sidebar", autoSelect: true };
    storeState.dashboard = { windowSize: "month", anchor: null };
    render(<TimeframePopup />);

    expect(closeMock).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(closeMock).toHaveBeenCalled();
  });

  it("month picker: clicking a month writes anchor and closes", async () => {
    storeState.dashboard = { windowSize: "month", anchor: null };
    render(<TimeframePopup />);
    await userEvent.click(screen.getByRole("button", { name: "Mar" }));
    expect(setAnchorMock).toHaveBeenCalledWith("dashboard", "2026-03-01");
    expect(closeMock).toHaveBeenCalled();
  });

  it("quarter picker: clicking Q1 writes start-of-quarter anchor", async () => {
    storeState.dashboard = { windowSize: "quarter", anchor: null };
    render(<TimeframePopup />);
    await userEvent.click(screen.getByRole("button", { name: /^Q1 2026$/ }));
    expect(setAnchorMock).toHaveBeenCalledWith("dashboard", "2026-01-01");
  });

  it("year picker: clicking 2024 writes start-of-year anchor", async () => {
    storeState.dashboard = { windowSize: "year", anchor: null };
    render(<TimeframePopup />);
    await userEvent.click(screen.getByRole("button", { name: "2024" }));
    expect(setAnchorMock).toHaveBeenCalledWith("dashboard", "2024-01-01");
  });

  it("ytd: shows readonly message, no picker", () => {
    storeState.dashboard = { windowSize: "ytd", anchor: null };
    render(<TimeframePopup />);
    expect(screen.getByText(/relative to today/i)).toBeInTheDocument();
  });

  it("custom: applying a range writes customRange and closes", async () => {
    storeState.dashboard = { windowSize: "custom", anchor: null };
    storeState.customRange = { start: "2026-02-01", end: "2026-02-15" };
    render(<TimeframePopup />);
    await userEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(setCustomRangeMock).toHaveBeenCalledWith({
      start: "2026-02-01",
      end: "2026-02-15",
    });
    expect(closeMock).toHaveBeenCalled();
  });
});
