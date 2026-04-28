import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({
    get: getMock,
    post: postMock,
    delete: deleteMock,
  }),
  useAuthReady: () => true,
}));

import {
  useClearPhone,
  useConfirmPhoneVerification,
  usePhoneStatus,
  useRequestPhoneVerification,
  useSmsUsage,
} from "./use-phone";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

describe("use-phone hooks", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    deleteMock.mockReset();
  });

  it("usePhoneStatus unwraps data envelope", async () => {
    getMock.mockResolvedValue({
      data: {
        phoneNumber: "+61400000000",
        phoneVerifiedAt: "2026-04-20T00:00:00Z",
        hasPending: false,
      },
    });

    const { result } = renderHook(() => usePhoneStatus(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith("/users/me/phone");
    expect(result.current.data).toEqual({
      phoneNumber: "+61400000000",
      phoneVerifiedAt: "2026-04-20T00:00:00Z",
      hasPending: false,
    });
  });

  it("useSmsUsage calls /users/me/sms-usage and unwraps", async () => {
    getMock.mockResolvedValue({
      data: {
        userTodayCount: 3,
        tenantTodayCount: 10,
        userDailyCap: 50,
        tenantDailyCap: 500,
        canSend: true,
      },
    });

    const { result } = renderHook(() => useSmsUsage(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith("/users/me/sms-usage");
    expect(result.current.data?.canSend).toBe(true);
  });

  it("useRequestPhoneVerification POSTs phoneNumber", async () => {
    postMock.mockResolvedValue({ data: { sent: true } });

    const { result } = renderHook(() => useRequestPhoneVerification(), {
      wrapper: withProvider(),
    });
    await result.current.mutateAsync("+61400000000");

    expect(postMock).toHaveBeenCalledWith("/users/me/phone/verify-request", {
      phoneNumber: "+61400000000",
    });
  });

  it("useConfirmPhoneVerification POSTs code", async () => {
    postMock.mockResolvedValue({
      data: {
        phoneNumber: "+61400000000",
        phoneVerifiedAt: "2026-04-25T00:00:00Z",
        hasPending: false,
      },
    });

    const { result } = renderHook(() => useConfirmPhoneVerification(), {
      wrapper: withProvider(),
    });
    const status = await result.current.mutateAsync("123456");

    expect(postMock).toHaveBeenCalledWith("/users/me/phone/verify-confirm", {
      code: "123456",
    });
    expect(status.phoneVerifiedAt).toBe("2026-04-25T00:00:00Z");
  });

  it("useClearPhone DELETEs /users/me/phone", async () => {
    deleteMock.mockResolvedValue({ data: { cleared: true } });

    const { result } = renderHook(() => useClearPhone(), { wrapper: withProvider() });
    await result.current.mutateAsync();

    expect(deleteMock).toHaveBeenCalledWith("/users/me/phone");
  });
});
