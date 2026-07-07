import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Message } from "@/types/message";

import { MessageCard } from "./message-card";

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "m1",
    bookingId: "b1",
    listingId: "l1",
    listingName: "Beach House",
    guestName: "Jane Guest",
    channel: "airbnb",
    status: "unread",
    priority: "low",
    subject: "Question about check-in",
    lastMessageTime: "2026-07-01T10:00:00Z",
    messageCount: 2,
    isGuest: true,
    previewText: "Hi, when can I check in?",
    checkIn: "2026-07-05",
    checkOut: "2026-07-08",
    ...overrides,
  };
}

describe("MessageCard channel chip", () => {
  it("renders a generic ota channel with the OTA label and its own colour token, not the direct fallback", () => {
    render(<MessageCard message={makeMessage({ channel: "ota" })} onClick={vi.fn()} />);

    const chip = screen.getByText("OTA");
    const style = chip.getAttribute("style") ?? "";
    expect(style).toContain("--channel-ota");
    expect(style).not.toContain("--channel-direct");
  });

  it("keeps the named channels mapped to their own colour", () => {
    render(<MessageCard message={makeMessage({ channel: "airbnb" })} onClick={vi.fn()} />);

    const chip = screen.getByText("Airbnb");
    expect(chip.getAttribute("style") ?? "").toContain("--channel-airbnb");
  });
});
