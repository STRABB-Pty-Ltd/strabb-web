import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DrillDownPanel } from "../drill-down-panel";

describe("DrillDownPanel", () => {
  it("renders when open", () => {
    render(
      <DrillDownPanel open onClose={vi.fn()} title="Test Panel">
        <p>Panel content</p>
      </DrillDownPanel>,
    );
    expect(screen.getByText("Test Panel")).toBeInTheDocument();
    expect(screen.getByText("Panel content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <DrillDownPanel open={false} onClose={vi.fn()} title="Test Panel">
        <p>Panel content</p>
      </DrillDownPanel>,
    );
    expect(screen.queryByText("Test Panel")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <DrillDownPanel open onClose={onClose} title="Test Panel">
        <p>content</p>
      </DrillDownPanel>,
    );
    const closeBtn = screen.getByRole("button");
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape key", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <DrillDownPanel open onClose={onClose} title="Test Panel">
        <p>content</p>
      </DrillDownPanel>,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
