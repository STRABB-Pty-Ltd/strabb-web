import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Drawer } from "../drawer";

describe("Drawer", () => {
  it("renders a dialog named by title, with the default header", () => {
    render(
      <Drawer open onClose={vi.fn()} title="Booking details">
        <p>content</p>
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Booking details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Booking details" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close panel" })).toBeInTheDocument();
  });

  it("keeps the title as the accessible name when a custom header replaces the default", () => {
    render(
      <Drawer open onClose={vi.fn()} title="Thread" header={<div>Rich header</div>}>
        <p>content</p>
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Thread" })).toBeInTheDocument();
    expect(screen.getByText("Rich header")).toBeInTheDocument();
    // Default header (and its close button) fully replaced.
    expect(screen.queryByRole("button", { name: "Close panel" })).not.toBeInTheDocument();
  });

  it("closes on Escape by default, but not when closeOnEscape is false", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <Drawer open onClose={onClose} title="A">
        <p>content</p>
      </Drawer>,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    rerender(
      <Drawer open onClose={onClose} title="A" closeOnEscape={false}>
        <p>content</p>
      </Drawer>,
    );
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders a scrim that closes on click, and none when scrim is false", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container, rerender } = render(
      <Drawer open onClose={onClose} title="A">
        <p>content</p>
      </Drawer>,
    );
    const scrim = container.querySelector('[data-slot="drawer-scrim"]');
    expect(scrim).not.toBeNull();
    await user.click(scrim as HTMLElement);
    expect(onClose).toHaveBeenCalled();

    rerender(
      <Drawer open onClose={onClose} title="A" scrim={false}>
        <p>content</p>
      </Drawer>,
    );
    expect(container.querySelector('[data-slot="drawer-scrim"]')).toBeNull();
  });

  it("stays mounted while the exit animation plays, then unmounts", async () => {
    const { rerender } = render(
      <Drawer open onClose={vi.fn()} title="A">
        <p>content</p>
      </Drawer>,
    );
    rerender(
      <Drawer open={false} onClose={vi.fn()} title="A">
        <p>content</p>
      </Drawer>,
    );
    // Still present during the exit window...
    expect(screen.getByRole("dialog", { name: "A" })).toBeInTheDocument();
    // ...gone once the delayed close elapses.
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "A" })).not.toBeInTheDocument(),
    );
  });

  it("anchors right by default, and left with no rightOffset when side is left", () => {
    const { getByRole, rerender } = render(
      <Drawer open onClose={vi.fn()} title="A" rightOffset="24px">
        <p>content</p>
      </Drawer>,
    );
    let panel = getByRole("dialog", { name: "A" });
    expect(panel.style.right).toBe("24px");
    expect(panel.style.left).toBe("");

    rerender(
      <Drawer open onClose={vi.fn()} title="A" side="left" rightOffset="24px">
        <p>content</p>
      </Drawer>,
    );
    panel = getByRole("dialog", { name: "A" });
    expect(panel.style.left).toBe("var(--overlay-left)");
    expect(panel.style.right).toBe("");
  });

  it("side=left shrinks to content (no bottom pin, capped by maxHeight); side=right still pins both edges", () => {
    const { getByRole, rerender } = render(
      <Drawer open onClose={vi.fn()} title="A">
        <p>content</p>
      </Drawer>,
    );
    let panel = getByRole("dialog", { name: "A" });
    expect(panel.style.bottom).toBe("var(--overlay-bottom)");
    expect(panel.style.maxHeight).toBe("");

    rerender(
      <Drawer open onClose={vi.fn()} title="A" side="left">
        <p>content</p>
      </Drawer>,
    );
    panel = getByRole("dialog", { name: "A" });
    expect(panel.style.bottom).toBe("");
    expect(panel.style.maxHeight).toBe("calc(100vh - var(--overlay-top) - var(--overlay-bottom))");
  });

  it("uses surface-60 (matching the desktop sidebar) when side is left, neutral-30 otherwise", () => {
    const { getByRole, rerender } = render(
      <Drawer open onClose={vi.fn()} title="A">
        <p>content</p>
      </Drawer>,
    );
    let panel = getByRole("dialog", { name: "A" });
    expect(panel.className).toContain("bg-[var(--neutral-30)]");
    expect(panel.className).not.toContain("bg-[var(--surface-60)]");

    rerender(
      <Drawer open onClose={vi.fn()} title="A" side="left">
        <p>content</p>
      </Drawer>,
    );
    panel = getByRole("dialog", { name: "A" });
    expect(panel.className).toContain("bg-[var(--surface-60)]");
    expect(panel.className).not.toContain("bg-[var(--neutral-30)]");
  });

  it("isolate stops mousedown bubbling out of the panel", async () => {
    const user = userEvent.setup();
    const outerMouseDown = vi.fn();
    render(
      <div onMouseDown={outerMouseDown}>
        <Drawer open onClose={vi.fn()} title="A" isolate>
          <p>content</p>
        </Drawer>
      </div>,
    );
    await user.click(screen.getByText("content"));
    expect(outerMouseDown).not.toHaveBeenCalled();
  });
});
