import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { postMock, patchMock } = vi.hoisted(() => ({ postMock: vi.fn(), patchMock: vi.fn() }));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ post: postMock, patch: patchMock }),
  useAuthReady: () => true,
}));

import { keysToSnake } from "@/lib/case-utils";

import {
  useCreateInvite,
  useDeactivateUser,
  useReactivateUser,
  useResendInvite,
  useRevokeInvite,
  useUpdateUserHourlyRate,
  useUpdateUserRole,
} from "./team-api";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

describe("team-api mutations", () => {
  beforeEach(() => {
    postMock.mockReset().mockResolvedValue(undefined);
    patchMock.mockReset().mockResolvedValue(undefined);
  });

  it("useCreateInvite POSTs the email + role to /invites", async () => {
    const { result } = renderHook(() => useCreateInvite(), { wrapper: withProvider() });
    result.current.mutate({ email: "new@example.com", role: "cleaner" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postMock).toHaveBeenCalledWith("/invites", {
      email: "new@example.com",
      role: "cleaner",
    });
  });

  it("useRevokeInvite POSTs to /invites/{id}/revoke", async () => {
    const { result } = renderHook(() => useRevokeInvite(), { wrapper: withProvider() });
    result.current.mutate("inv-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postMock).toHaveBeenCalledWith("/invites/inv-1/revoke", {});
  });

  it("useResendInvite POSTs to /invites/{id}/resend", async () => {
    const { result } = renderHook(() => useResendInvite(), { wrapper: withProvider() });
    result.current.mutate("inv-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postMock).toHaveBeenCalledWith("/invites/inv-1/resend", {});
  });

  it("useUpdateUserRole PATCHes the role to /users/{id}", async () => {
    const { result } = renderHook(() => useUpdateUserRole(), { wrapper: withProvider() });
    result.current.mutate({ id: "u-1", role: "admin" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patchMock).toHaveBeenCalledWith("/users/u-1", { role: "admin" });
  });

  it("useUpdateUserHourlyRate PATCHes the rate, serialised as hourly_rate", async () => {
    const { result } = renderHook(() => useUpdateUserHourlyRate(), { wrapper: withProvider() });
    result.current.mutate({ id: "u-2", hourlyRate: 45 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // The hook passes camelCase; the api client keysToSnake-converts before the
    // wire, so the body the api receives carries hourly_rate.
    expect(patchMock).toHaveBeenCalledWith("/users/u-2", { hourlyRate: 45 });
    expect(keysToSnake({ hourlyRate: 45 })).toEqual({ hourly_rate: 45 });
  });

  it("useDeactivateUser POSTs to /users/{id}/deactivate", async () => {
    const { result } = renderHook(() => useDeactivateUser(), { wrapper: withProvider() });
    result.current.mutate("u-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postMock).toHaveBeenCalledWith("/users/u-1/deactivate", {});
  });

  it("useReactivateUser POSTs to /users/{id}/reactivate", async () => {
    const { result } = renderHook(() => useReactivateUser(), { wrapper: withProvider() });
    result.current.mutate("u-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postMock).toHaveBeenCalledWith("/users/u-1/reactivate", {});
  });
});
