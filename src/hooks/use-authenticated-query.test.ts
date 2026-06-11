import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();

vi.mock("./use-api-client", () => ({
  useApiClient: () => ({ get: getMock }),
  useAuthReady: () => true,
}));

const useSessionMock = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

import { REFRESH_TOKEN_ERROR } from "@/lib/auth-constants";

import { useAuthenticatedQuery } from "./use-authenticated-query";

function makeWrapper(): {
  client: QueryClient;
  Wrapper: (props: { children: ReactNode }) => ReactNode;
} {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return { client, Wrapper };
}

describe("useAuthenticatedQuery", () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    getMock.mockReset();
  });

  it("does not fire query when status is loading", () => {
    useSessionMock.mockReturnValue({ data: null, status: "loading" });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useAuthenticatedQuery<{ id: string }>(["thing"], "/thing"),
      { wrapper: Wrapper },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("does not fire query when status is unauthenticated", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useAuthenticatedQuery<{ id: string }>(["thing"], "/thing"),
      { wrapper: Wrapper },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("does not fire query when authenticated but accessToken is missing", () => {
    useSessionMock.mockReturnValue({ data: {}, status: "authenticated" });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useAuthenticatedQuery<{ id: string }>(["thing"], "/thing"),
      { wrapper: Wrapper },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("does not fire query when the session carries a RefreshTokenError flag", () => {
    useSessionMock.mockReturnValue({
      data: { accessToken: "token-123", error: REFRESH_TOKEN_ERROR },
      status: "authenticated",
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useAuthenticatedQuery<{ id: string }>(["thing"], "/thing"),
      { wrapper: Wrapper },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("fires query when authenticated and accessToken is present", async () => {
    useSessionMock.mockReturnValue({
      data: { accessToken: "token-123" },
      status: "authenticated",
    });
    getMock.mockResolvedValue({ id: "thing-1" });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useAuthenticatedQuery<{ id: string }>(["thing"], "/thing"),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(getMock).toHaveBeenCalledWith("/thing");
    expect(result.current.data?.id).toBe("thing-1");
  });

  it("respects user-passed enabled: false even when auth is ready", () => {
    useSessionMock.mockReturnValue({
      data: { accessToken: "token-123" },
      status: "authenticated",
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () =>
        useAuthenticatedQuery<{ id: string }>(["thing"], "/thing", {
          enabled: false,
        }),
      { wrapper: Wrapper },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("fires query when user-passed enabled: true and auth is ready", async () => {
    useSessionMock.mockReturnValue({
      data: { accessToken: "token-123" },
      status: "authenticated",
    });
    getMock.mockResolvedValue({ id: "thing-2" });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(
      () =>
        useAuthenticatedQuery<{ id: string }>(["thing"], "/thing", {
          enabled: true,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(getMock).toHaveBeenCalledWith("/thing");
    expect(result.current.data?.id).toBe("thing-2");
  });
});
