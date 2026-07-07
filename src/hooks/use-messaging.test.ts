import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { postMock, addToastMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  addToastMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ post: postMock }),
  useAuthReady: () => true,
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

import { useMessageActions } from "./use-messaging";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

describe("useMessageActions.sendReply error handling", () => {
  beforeEach(() => {
    postMock.mockReset();
    addToastMock.mockReset();
  });

  it("surfaces the backend detail message via replyErrors and a toast on failure", async () => {
    postMock.mockRejectedValue(new Error("No delivery address configured for this conversation"));
    const { result } = renderHook(() => useMessageActions(), { wrapper: withProvider() });

    act(() => {
      result.current.sendReply("c-1", "hi");
    });

    await waitFor(() =>
      expect(result.current.replyErrors["c-1"]).toBe(
        "No delivery address configured for this conversation",
      ),
    );
    expect(addToastMock).toHaveBeenCalledWith({
      type: "error",
      message: "No delivery address configured for this conversation",
    });
  });

  it("clears a conversation's reply error on the next send attempt", async () => {
    postMock.mockRejectedValueOnce(new Error("Failed to send message via Channex: boom"));
    const { result } = renderHook(() => useMessageActions(), { wrapper: withProvider() });

    act(() => {
      result.current.sendReply("c-1", "hi");
    });
    await waitFor(() => expect(result.current.replyErrors["c-1"]).toBeTruthy());

    postMock.mockResolvedValueOnce({ data: { id: "msg-2" } });
    act(() => {
      result.current.sendReply("c-1", "retry");
    });

    await waitFor(() => expect(result.current.replyErrors["c-1"]).toBeUndefined());
  });

  it("clearReplyError removes the error for a given conversation", async () => {
    postMock.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useMessageActions(), { wrapper: withProvider() });

    act(() => {
      result.current.sendReply("c-1", "hi");
    });
    await waitFor(() => expect(result.current.replyErrors["c-1"]).toBe("boom"));

    act(() => {
      result.current.clearReplyError("c-1");
    });
    expect(result.current.replyErrors["c-1"]).toBeUndefined();
  });
});
