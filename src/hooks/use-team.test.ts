import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ get: getMock }),
  useAuthReady: () => true,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { accessToken: "mock" }, status: "authenticated" }),
}));

import { useInvites, useTeamMembers } from "./use-team";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

describe("use-team hooks", () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({ data: [] });
  });

  it("useTeamMembers hits /users with no query string by default", async () => {
    const { result } = renderHook(() => useTeamMembers(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/users");
  });

  it("useTeamMembers filters by role", async () => {
    const { result } = renderHook(() => useTeamMembers({ role: "cleaner" }), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/users?role=cleaner");
  });

  it("useTeamMembers requests inactive users when includeInactive is set", async () => {
    const { result } = renderHook(() => useTeamMembers({ includeInactive: true }), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/users?include_inactive=true");
  });

  it("unwraps the { data: [...] } envelope onto the query result", async () => {
    getMock.mockResolvedValue({
      data: [{ id: "u1", email: "a@b.com", full_name: "Ada", role: "owner", is_active: true }],
    });
    const { result } = renderHook(() => useTeamMembers(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data[0].fullName).toBe("Ada");
  });

  it("useInvites hits /invites", async () => {
    const { result } = renderHook(() => useInvites(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/invites");
  });
});
