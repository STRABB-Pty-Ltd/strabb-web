import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CacheResetOnIdentityChange } from "./cache-reset-on-identity-change";

const useSessionMock = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

function authed(tenantId: string, userId: string) {
  return { data: { tenantId, userId }, status: "authenticated" };
}

describe("CacheResetOnIdentityChange", () => {
  let queryClient: QueryClient;
  let clearSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    queryClient = new QueryClient();
    clearSpy = vi.spyOn(queryClient, "clear");
    useSessionMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // A fresh element every render: React bails out of re-rendering when the
  // element reference is unchanged, which would skip re-reading the mock.
  const ui = () => (
    <QueryClientProvider client={queryClient}>
      <CacheResetOnIdentityChange />
    </QueryClientProvider>
  );

  function renderGuard() {
    const utils = render(ui());
    return { ...utils, rerender: () => utils.rerender(ui()) };
  }

  it("does not clear on the initial resolved session", () => {
    useSessionMock.mockReturnValue(authed("t1", "u1"));
    renderGuard();
    expect(clearSpy).not.toHaveBeenCalled();
  });

  it("does not clear while the session is still loading", () => {
    useSessionMock.mockReturnValue({ data: undefined, status: "loading" });
    const { rerender } = renderGuard();
    useSessionMock.mockReturnValue(authed("t1", "u1")); // resolves for the first time
    rerender();
    expect(clearSpy).not.toHaveBeenCalled();
  });

  it("clears when the user changes within the tab (soft switch)", () => {
    useSessionMock.mockReturnValue(authed("t1", "u1"));
    const { rerender } = renderGuard();
    expect(clearSpy).not.toHaveBeenCalled();

    useSessionMock.mockReturnValue(authed("t2", "u2")); // different tenant + user
    rerender();
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it("clears when the session drops to null (expiry / logout)", () => {
    useSessionMock.mockReturnValue(authed("t1", "u1"));
    const { rerender } = renderGuard();

    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
    rerender();
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it("does not clear on a re-render with the same identity", () => {
    useSessionMock.mockReturnValue(authed("t1", "u1"));
    const { rerender } = renderGuard();
    rerender();
    expect(clearSpy).not.toHaveBeenCalled();
  });
});
