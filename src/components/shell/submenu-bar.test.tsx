import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Chip-behavior logic itself (single-default/toggle/multi/exclusive/nav/
// more-dropdown, view-snapping, onNavSubRoute) is covered directly in
// src/hooks/use-submenu-chips.test.ts and via the real store in
// src/__tests__/integration/submenu-chips.test.tsx. This file only covers
// what SubmenuBar itself renders/delegates now that the hook owns the
// behavior - no test here exists today, so this is new coverage.
const { useSubmenuChipsMock } = vi.hoisted(() => ({ useSubmenuChipsMock: vi.fn() }));

vi.mock("@/hooks/use-submenu-chips", () => ({
  useSubmenuChips: () => useSubmenuChipsMock(),
}));

vi.mock("./submenu-left-slot", () => ({
  SubmenuLeftSlot: () => <div>left-slot</div>,
}));

import { SubmenuBar } from "./submenu-bar";

const baseHook = {
  currentPage: "dashboard" as const,
  chips: [
    { id: "overview", label: "Overview", behavior: "single-default" as const, defaultActive: true },
    { id: "compare", label: "Compare", behavior: "more-dropdown" as const },
  ],
  isChipActive: (chip: { id: string }) => chip.id === "overview",
  handleChipClick: vi.fn(),
  moreOpen: false,
  moreRef: { current: null },
};

describe("SubmenuBar", () => {
  beforeEach(() => {
    baseHook.handleChipClick.mockReset();
    useSubmenuChipsMock.mockReset();
    useSubmenuChipsMock.mockReturnValue(baseHook);
  });

  it("renders the left slot and each chip from the hook", () => {
    render(<SubmenuBar />);
    expect(screen.getByText("left-slot")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Compare")).toBeInTheDocument();
  });

  it("clicking a chip delegates to the hook's handleChipClick", async () => {
    render(<SubmenuBar />);
    await userEvent.click(screen.getByText("Overview"));
    expect(baseHook.handleChipClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "overview" }),
    );
  });

  it("shows the More dropdown's coming-soon content when moreOpen is true", () => {
    useSubmenuChipsMock.mockReturnValue({ ...baseHook, moreOpen: true });
    render(<SubmenuBar />);
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("renders only the height-preserving spacer on settings, no chips", () => {
    useSubmenuChipsMock.mockReturnValue({ ...baseHook, currentPage: "settings", chips: [] });
    const { container } = render(<SubmenuBar />);
    expect(container.querySelectorAll("button, a")).toHaveLength(0);
    expect(screen.queryByText("left-slot")).not.toBeInTheDocument();
  });
});
