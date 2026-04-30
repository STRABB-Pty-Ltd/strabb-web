import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSessionMock = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

const createClientMock = vi.fn();
vi.mock("@/lib/api-client", () => ({
  createAuthenticatedClient: (token: string) => createClientMock(token),
}));

import { useApiClient, useAuthReady } from "./use-api-client";

describe("useApiClient", () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    createClientMock.mockReset();
    // Return a fresh object per call so identity differs when invoked again
    createClientMock.mockImplementation((token: string) => ({ token }));
  });

  it("returns the same client identity across renders when token is unchanged (memoized)", () => {
    useSessionMock.mockReturnValue({
      data: { accessToken: "tok-1" },
      status: "authenticated",
    });

    const { result, rerender } = renderHook(() => useApiClient());
    const first = result.current;
    rerender();
    const second = result.current;

    expect(first).toBe(second);
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock).toHaveBeenCalledWith("tok-1");
  });

  it("returns a new client when access token changes (memo invalidates)", () => {
    useSessionMock.mockReturnValue({
      data: { accessToken: "tok-1" },
      status: "authenticated",
    });

    const { result, rerender } = renderHook(() => useApiClient());
    const first = result.current;

    useSessionMock.mockReturnValue({
      data: { accessToken: "tok-2" },
      status: "authenticated",
    });
    rerender();
    const second = result.current;

    expect(first).not.toBe(second);
    expect(createClientMock).toHaveBeenCalledTimes(2);
    expect(createClientMock).toHaveBeenNthCalledWith(1, "tok-1");
    expect(createClientMock).toHaveBeenNthCalledWith(2, "tok-2");
  });

  it("builds a client with empty string when session is undefined (no crash)", () => {
    useSessionMock.mockReturnValue({ data: undefined, status: "loading" });

    const { result } = renderHook(() => useApiClient());

    expect(createClientMock).toHaveBeenCalledWith("");
    expect(result.current).toEqual({ token: "" });
  });

  it("builds a client with empty string when session exists but accessToken is missing", () => {
    useSessionMock.mockReturnValue({
      data: { accessToken: null },
      status: "authenticated",
    });

    const { result } = renderHook(() => useApiClient());

    expect(createClientMock).toHaveBeenCalledWith("");
    expect(result.current).toEqual({ token: "" });
  });

  it("calls createAuthenticatedClient with the actual access token from session", () => {
    useSessionMock.mockReturnValue({
      data: { accessToken: "real-jwt-abc" },
      status: "authenticated",
    });

    renderHook(() => useApiClient());

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock).toHaveBeenCalledWith("real-jwt-abc");
  });
});

describe("useAuthReady", () => {
  beforeEach(() => {
    useSessionMock.mockReset();
  });

  it("returns false when status is 'loading'", () => {
    useSessionMock.mockReturnValue({ data: null, status: "loading" });

    const { result } = renderHook(() => useAuthReady());

    expect(result.current).toBe(false);
  });

  it("returns false when status is 'unauthenticated'", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    const { result } = renderHook(() => useAuthReady());

    expect(result.current).toBe(false);
  });

  it("returns false when status is 'authenticated' but accessToken is missing", () => {
    useSessionMock.mockReturnValue({
      data: { accessToken: null },
      status: "authenticated",
    });

    const { result } = renderHook(() => useAuthReady());

    expect(result.current).toBe(false);
  });

  it("returns true when status is 'authenticated' AND accessToken is present", () => {
    useSessionMock.mockReturnValue({
      data: { accessToken: "tok" },
      status: "authenticated",
    });

    const { result } = renderHook(() => useAuthReady());

    expect(result.current).toBe(true);
  });
});
