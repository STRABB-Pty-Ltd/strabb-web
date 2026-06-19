import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, postMock, patchMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ get: getMock, post: postMock, patch: patchMock }),
  useAuthReady: () => true,
}));

import {
  useConvertToTicketAPI,
  useMessageThreadAPI,
  useMessagesAPI,
  useSendMessageAPI,
  useUpdateConversationStatusAPI,
} from "./messaging-api";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

const rawConvo = (status: string) => ({
  id: `c-${status}`,
  bookingId: "b-1",
  listingId: "lst-1",
  listingName: "Beach House",
  guestName: "Alice",
  channel: "airbnb",
  subject: "Question about checkout",
  preview: "Hi, what time?",
  status,
  priority: "normal",
  lastMessageAt: "2026-05-01T00:00:00Z",
  messageCount: 4,
  checkIn: "2026-05-01T00:00:00Z",
  checkOut: "2026-05-04T00:00:00Z",
});

describe("messaging-api hooks", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
  });

  it("useMessagesAPI propagates channel + listing filters to the URL", async () => {
    getMock.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useMessagesAPI(["airbnb"], [], ["lst-1"]), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getMock.mock.calls[0][0] as string;
    expect(url).toMatch(/^\/conversations\?/);
    expect(url).toMatch(/channel=airbnb/);
    expect(url).toMatch(/listing_ids=lst-1/);
  });

  it("useMessagesAPI applies status filter client-side without refetching", async () => {
    getMock.mockResolvedValue({
      data: [rawConvo("unread"), rawConvo("read"), rawConvo("flagged")],
    });
    const { result } = renderHook(() => useMessagesAPI([], ["unread"], []), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.map((m) => m.status)).toEqual(["unread"]);
    // Only one network call regardless of the submenu filter combination.
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it("useMessageThreadAPI is disabled when messageId is null", () => {
    const { result } = renderHook(() => useMessageThreadAPI(null), { wrapper: withProvider() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("useMessageThreadAPI maps senderType=guest to isGuest=true", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "msg-1",
          conversationId: "c-1",
          senderType: "guest",
          body: "Hi",
          sentAt: "2026-05-01T00:00:00Z",
          senderName: "Alice",
        },
        {
          id: "msg-2",
          conversationId: "c-1",
          senderType: "host",
          body: "Hey",
          sentAt: "2026-05-01T00:01:00Z",
          senderName: "Will",
        },
      ],
    });

    const { result } = renderHook(() => useMessageThreadAPI("c-1"), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      expect.objectContaining({ id: "msg-1", isGuest: true }),
      expect.objectContaining({ id: "msg-2", isGuest: false }),
    ]);
  });

  it("send / update-status / convert-to-ticket mutations target the right routes", async () => {
    postMock.mockResolvedValue({ data: { id: "msg-new" } });
    patchMock.mockResolvedValue({ data: { id: "c-1" } });

    const send = renderHook(() => useSendMessageAPI(), { wrapper: withProvider() });
    await send.result.current.mutateAsync({ conversationId: "c-1", content: "ack" });
    expect(postMock).toHaveBeenCalledWith("/conversations/c-1/messages", { body: "ack" });

    const status = renderHook(() => useUpdateConversationStatusAPI(), { wrapper: withProvider() });
    await status.result.current.mutateAsync({ id: "c-1", status: "read" });
    expect(patchMock).toHaveBeenCalledWith("/conversations/c-1/status", { status: "read" });

    const convert = renderHook(() => useConvertToTicketAPI(), { wrapper: withProvider() });
    await convert.result.current.mutateAsync({ conversationId: "c-1", description: "Broken AC" });
    expect(postMock).toHaveBeenCalledWith("/conversations/c-1/convert-to-ticket", {
      description: "Broken AC",
    });
  });

  it("useMessagesAPI keeps the pinned conversation in view despite the status filter", async () => {
    getMock.mockResolvedValue({
      data: [rawConvo("unread"), rawConvo("read"), rawConvo("flagged")],
    });
    const { result } = renderHook(() => useMessagesAPI([], ["unread"], [], "c-read"), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // c-read does not match the Unread filter but is pinned, so it stays.
    expect(result.current.data?.map((m) => m.id).sort()).toEqual(["c-read", "c-unread"]);
  });
});
