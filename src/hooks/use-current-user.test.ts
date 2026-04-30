import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/types/auth";

const useSessionMock = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

import { useCurrentUser } from "./use-current-user";

const mockCurrentUser: CurrentUser = {
  id: "user-1",
  tenantId: "tenant-1",
  email: "will@strabb.io",
  fullName: "Will Flynn",
  role: "admin",
  isActive: true,
};

describe("useCurrentUser", () => {
  beforeEach(() => {
    useSessionMock.mockReset();
  });

  it("returns isAuthenticated=true and projects currentUser/role when authenticated", () => {
    useSessionMock.mockReturnValue({
      data: {
        accessToken: "tok",
        tenantId: "tenant-1",
        userId: "user-1",
        role: "admin",
        currentUser: mockCurrentUser,
      },
      status: "authenticated",
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.currentUser).toEqual(mockCurrentUser);
    expect(result.current.role).toBe("admin");
  });

  it("returns isAuthenticated=false and nulls when unauthenticated", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.currentUser).toBeNull();
    expect(result.current.role).toBeNull();
  });

  it("returns isAuthenticated=false and nulls when loading with no data", () => {
    useSessionMock.mockReturnValue({ data: null, status: "loading" });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.currentUser).toBeNull();
    expect(result.current.role).toBeNull();
  });

  it("passes status through unchanged for each of the three states", () => {
    useSessionMock.mockReturnValue({
      data: {
        accessToken: "tok",
        tenantId: "tenant-1",
        userId: "user-1",
        role: "admin",
        currentUser: mockCurrentUser,
      },
      status: "authenticated",
    });
    expect(renderHook(() => useCurrentUser()).result.current.status).toBe("authenticated");

    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
    expect(renderHook(() => useCurrentUser()).result.current.status).toBe("unauthenticated");

    useSessionMock.mockReturnValue({ data: null, status: "loading" });
    expect(renderHook(() => useCurrentUser()).result.current.status).toBe("loading");
  });
});
