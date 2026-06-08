import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useSavedReportsMock } = vi.hoisted(() => ({
  useSavedReportsMock: vi.fn(),
}));

vi.mock("@/hooks/use-reporting", () => ({
  useSavedReports: () => useSavedReportsMock(),
}));

import { SavedReportsDrawer } from "./saved-reports-drawer";

const mockReports = [
  { id: "sr-1", name: "Q1 Review", timeframe: "month", submenu: ["revenue"], createdAt: "" },
  {
    id: "sr-2",
    name: "Annual",
    timeframe: "year",
    submenu: ["revenue", "expenses"],
    createdAt: "",
  },
];

function setup(overrides: Record<string, unknown> = {}) {
  const resetToDefaultView = vi.fn();
  const loadReport = vi.fn();
  useSavedReportsMock.mockReturnValue({
    savedReports: mockReports,
    activeSavedReport: null,
    loadReport,
    saveCurrentReport: vi.fn(),
    deleteReport: vi.fn(),
    resetToDefaultView,
    ...overrides,
  });
  return { resetToDefaultView, loadReport };
}

// The active row carries the inverted selected treatment (highlight-10 bg).
const rowFor = (name: string) =>
  screen.getByText(name).closest("[class*='justify-between']") as HTMLElement;

describe("SavedReportsDrawer active report highlight (#6b)", () => {
  beforeEach(() => {
    useSavedReportsMock.mockReset();
  });

  it("applies the inverted selected style to the active report row", () => {
    setup({ activeSavedReport: "sr-1" });
    render(<SavedReportsDrawer />);

    const activeRow = rowFor("Q1 Review");
    expect(activeRow).toHaveStyle({ backgroundColor: "var(--highlight-10)" });
    expect(activeRow).toHaveAttribute("aria-current", "true");
  });

  it("leaves non-active rows un-highlighted", () => {
    setup({ activeSavedReport: "sr-1" });
    render(<SavedReportsDrawer />);

    const inactiveRow = rowFor("Annual");
    expect(inactiveRow).not.toHaveStyle({ backgroundColor: "var(--highlight-10)" });
    expect(inactiveRow).not.toHaveAttribute("aria-current");
  });

  it("highlights no row when the default view is active (no active report)", () => {
    setup({ activeSavedReport: null });
    render(<SavedReportsDrawer />);

    expect(rowFor("Q1 Review")).not.toHaveAttribute("aria-current");
    expect(rowFor("Annual")).not.toHaveAttribute("aria-current");
  });
});

describe("SavedReportsDrawer Show default button (#6a)", () => {
  beforeEach(() => {
    useSavedReportsMock.mockReset();
  });

  it("calls resetToDefaultView when clicked", async () => {
    const { resetToDefaultView } = setup({ activeSavedReport: "sr-1" });
    render(<SavedReportsDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /show default/i }));
    expect(resetToDefaultView).toHaveBeenCalledTimes(1);
  });

  it("is disabled when there is no active saved report", () => {
    setup({ activeSavedReport: null });
    render(<SavedReportsDrawer />);

    expect(screen.getByRole("button", { name: /show default/i })).toBeDisabled();
  });

  it("is enabled when a saved report is active", () => {
    setup({ activeSavedReport: "sr-2" });
    render(<SavedReportsDrawer />);

    expect(screen.getByRole("button", { name: /show default/i })).toBeEnabled();
  });
});
