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

  it("shows the reply error message when a send fails", () => {
    renderOverlay({ replyError: "No delivery address configured for this conversation" });

    expect(
      screen.getByText("No delivery address configured for this conversation"),
    ).toBeInTheDocument();
  });

  it("does not show a reply error when there is none", () => {
    renderOverlay({ replyError: null });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("dismisses the reply error as the host edits the compose box", () => {
    const onDismissReplyError = vi.fn();
    renderOverlay({
      replyError: "Failed to send message via Channex: boom",
      onDismissReplyError,
    });

    fireEvent.change(screen.getByLabelText("Compose reply"), { target: { value: "retry" } });

    expect(onDismissReplyError).toHaveBeenCalledTimes(1);
  });

  it("renders a failed-to-send label on a message with deliveryStatus=failed", () => {
    renderOverlay({
      messages: [
        {
          id: "m-1",
          messageId: "c-1",
          content: "Hi there",
          sentAt: "2026-05-01T00:00:00Z",
          isGuest: false,
          senderName: "Will",
          deliveryStatus: "failed",
        },
      ],
    });

    expect(screen.getByText("Failed to send")).toBeInTheDocument();
  });

  it("does not render a failed-to-send label on a normally sent message", () => {
    renderOverlay({
      messages: [
        {
          id: "m-1",
          messageId: "c-1",
          content: "Hi there",
          sentAt: "2026-05-01T00:00:00Z",
          isGuest: false,
          senderName: "Will",
          deliveryStatus: "sent",
        },
      ],
    });

    expect(screen.queryByText("Failed to send")).not.toBeInTheDocument();
  });

  it("renders the OTA label and colour for a Channex ingest-fallback conversation", () => {
    renderOverlay({ channel: "ota" });

    const chip = screen.getByText("OTA");
    expect(chip).toBeInTheDocument();
    expect(chip.style.backgroundColor).not.toBe("var(--channel-direct)");
    expect(chip.style.backgroundColor).toBe("var(--channel-ota)");
  });
});
