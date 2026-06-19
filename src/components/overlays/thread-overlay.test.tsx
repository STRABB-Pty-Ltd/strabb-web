import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ThreadOverlay } from "./thread-overlay";

const baseProps = {
  open: true,
  onClose: vi.fn(),
  guestName: "Alice",
  listingName: "Beach House",
  checkIn: "2026-05-01",
  checkOut: "2026-05-04",
  channel: "airbnb",
  messages: [],
};

const renderOverlay = (overrides: Partial<React.ComponentProps<typeof ThreadOverlay>> = {}) =>
  render(
    <ThreadOverlay
      {...baseProps}
      onSendReply={vi.fn()}
      onFlag={vi.fn()}
      onConvertTicket={vi.fn()}
      onArchive={vi.fn()}
      {...overrides}
    />,
  );

describe("ThreadOverlay actions", () => {
  it("calls the triage handlers when their buttons are clicked", () => {
    const onFlag = vi.fn();
    const onConvertTicket = vi.fn();
    const onArchive = vi.fn();
    renderOverlay({ onFlag, onConvertTicket, onArchive });

    fireEvent.click(screen.getByRole("button", { name: "Flag" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Ticket" }));
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    expect(onFlag).toHaveBeenCalledTimes(1);
    expect(onConvertTicket).toHaveBeenCalledTimes(1);
    expect(onArchive).toHaveBeenCalledTimes(1);
  });

  it("sends a reply and clears the compose box", () => {
    const onSendReply = vi.fn();
    renderOverlay({ onSendReply });

    const box = screen.getByLabelText("Compose reply") as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: "On my way" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));

    expect(onSendReply).toHaveBeenCalledWith("On my way");
    expect(box.value).toBe("");
  });

  it("does not send a blank reply", () => {
    const onSendReply = vi.fn();
    renderOverlay({ onSendReply });

    fireEvent.change(screen.getByLabelText("Compose reply"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Send reply" }));

    expect(onSendReply).not.toHaveBeenCalled();
  });
});
