import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { messagesMock, threadMock, actionsMock, storeMock } = vi.hoisted(() => ({
  messagesMock: vi.fn(),
  threadMock: vi.fn(),
  actionsMock: vi.fn(),
  storeMock: vi.fn(),
}));

vi.mock("@/hooks/use-messaging", () => ({
  useMessages: (...args: unknown[]) => messagesMock(...args),
  useMessageThread: (...args: unknown[]) => threadMock(...args),
  useMessageActions: () => actionsMock(),
  ticketDescriptionFor: () => "desc",
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector(storeMock()),
}));

vi.mock("./_components/messaging-kanban-view", () => ({
  MessagingKanbanView: ({ messages }: { messages: unknown[] }) => (
    <div data-testid="kanban-view">{messages.length} messages</div>
  ),
}));
vi.mock("./_components/messaging-list-view", () => ({
  MessagingListView: ({ messages }: { messages: unknown[] }) => (
    <div data-testid="list-view">{messages.length} messages</div>
  ),
}));
vi.mock("@/components/overlays/thread-overlay", () => ({
  ThreadOverlay: ({ open }: { open: boolean }) => (
    <div data-testid="thread-overlay">{open ? "open" : "closed"}</div>
  ),
}));

import MessagingPage from "./page";

const storeFor = (view: string, threadOpen = false, threadId: string | null = null) => ({
  messaging: {
    view,
    submenu: [],
    channels: [],
    selectedMessage: null,
  },
  selectedListings: [],
  threadOverlay: threadOpen ? { open: true, messageId: threadId } : null,
  closeThreadOverlay: vi.fn(),
});

describe("MessagingPage", () => {
  beforeEach(() => {
    messagesMock.mockReset();
    threadMock.mockReset();
    actionsMock.mockReset();
    storeMock.mockReset();
    actionsMock.mockReturnValue({ markAsRead: vi.fn(), markAsUnread: vi.fn() });
    threadMock.mockReturnValue({ data: undefined });
  });

  it("renders the loading skeleton while messages are loading", () => {
    storeMock.mockReturnValue(storeFor("list"));
    messagesMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<MessagingPage />);
    expect(screen.getByText(/loading messages/i)).toBeInTheDocument();
    expect(screen.queryByTestId("list-view")).not.toBeInTheDocument();
  });

  it("renders the list view with the message count when view=list", () => {
    storeMock.mockReturnValue(storeFor("list"));
    messagesMock.mockReturnValue({
      data: [{ id: "c-1", status: "read", guestName: "A", listingName: "L", channel: "airbnb" }],
      isLoading: false,
    });
    render(<MessagingPage />);
    expect(screen.getByTestId("list-view")).toHaveTextContent("1 messages");
  });

  it("renders the kanban view when view=kanban", () => {
    storeMock.mockReturnValue(storeFor("kanban"));
    messagesMock.mockReturnValue({ data: [], isLoading: false });
    render(<MessagingPage />);
    expect(screen.getByTestId("kanban-view")).toBeInTheDocument();
  });

  it("renders the thread overlay (open) when kanban + threadOverlay is open", () => {
    storeMock.mockReturnValue(storeFor("kanban", true, "c-1"));
    messagesMock.mockReturnValue({
      data: [
        {
          id: "c-1",
          status: "read",
          guestName: "Alice",
          listingName: "Beach House",
          channel: "airbnb",
          checkIn: "2026-05-01",
          checkOut: "2026-05-04",
        },
      ],
      isLoading: false,
    });
    threadMock.mockReturnValue({ data: [] });
    render(<MessagingPage />);
    expect(screen.getByTestId("thread-overlay")).toHaveTextContent("open");
  });
});

describe("MessagingPage read-on-open", () => {
  const markAsRead = vi.fn();

  const openStore = (selectedMessage: string | null) => ({
    messaging: { view: "list", submenu: [], channels: [], selectedMessage },
    selectedListings: [],
    threadOverlay: null,
    closeThreadOverlay: vi.fn(),
  });

  const conv = (status: string) => ({
    id: "c-1",
    status,
    guestName: "A",
    listingName: "L",
    channel: "airbnb",
  });

  beforeEach(() => {
    messagesMock.mockReset();
    threadMock.mockReset();
    actionsMock.mockReset();
    storeMock.mockReset();
    markAsRead.mockReset();
    actionsMock.mockReturnValue({ markAsRead });
    threadMock.mockReturnValue({ data: undefined });
  });

  it("marks an unread conversation read when it is opened", () => {
    storeMock.mockReturnValue(openStore("c-1"));
    messagesMock.mockReturnValue({ data: [conv("unread")], isLoading: false });
    render(<MessagingPage />);
    expect(markAsRead).toHaveBeenCalledWith("c-1");
  });

  it("leaves an already-read conversation untouched on open", () => {
    storeMock.mockReturnValue(openStore("c-1"));
    messagesMock.mockReturnValue({ data: [conv("read")], isLoading: false });
    render(<MessagingPage />);
    expect(markAsRead).not.toHaveBeenCalled();
  });

  it("does not mark anything read when nothing is open", () => {
    storeMock.mockReturnValue(openStore(null));
    messagesMock.mockReturnValue({ data: [conv("unread")], isLoading: false });
    render(<MessagingPage />);
    expect(markAsRead).not.toHaveBeenCalled();
  });
});
