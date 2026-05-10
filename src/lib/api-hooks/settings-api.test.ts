import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, putMock } = vi.hoisted(() => ({ getMock: vi.fn(), putMock: vi.fn() }));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ get: getMock, put: putMock }),
  useAuthReady: () => true,
}));

import { useSettingsSectionAPI, useUpdateSettingsSectionAPI } from "./settings-api";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

interface GeneralSettings {
  companyName: string;
  timezone: string;
}

describe("settings-api hooks", () => {
  beforeEach(() => {
    getMock.mockReset();
    putMock.mockReset();
  });

  it("useSettingsSectionAPI fetches /settings/{section} and unwraps envelope", async () => {
    getMock.mockResolvedValue({ data: { companyName: "STRABB", timezone: "Australia/Sydney" } });
    const { result } = renderHook(() => useSettingsSectionAPI<GeneralSettings>("general"), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith("/settings/general");
    expect(result.current.data).toEqual({ companyName: "STRABB", timezone: "Australia/Sydney" });
  });

  it("section name appears in the cache key (so two sections don't share data)", async () => {
    getMock.mockImplementation(async (url: string) => {
      if (url === "/settings/general") return { data: { companyName: "STRABB", timezone: "AU" } };
      if (url === "/settings/notifications") return { data: { emailEnabled: true } };
      return { data: {} };
    });

    const general = renderHook(() => useSettingsSectionAPI<GeneralSettings>("general"), {
      wrapper: withProvider(),
    });
    const notifications = renderHook(
      () => useSettingsSectionAPI<{ emailEnabled: boolean }>("notifications"),
      { wrapper: withProvider() },
    );
    await waitFor(() => expect(general.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(notifications.result.current.isSuccess).toBe(true));

    expect(general.result.current.data).toEqual({ companyName: "STRABB", timezone: "AU" });
    expect(notifications.result.current.data).toEqual({ emailEnabled: true });
  });

  it("useUpdateSettingsSectionAPI PUTs the section with the typed payload", async () => {
    putMock.mockResolvedValue({ data: { ok: true } });
    const { result } = renderHook(() => useUpdateSettingsSectionAPI<GeneralSettings>("general"), {
      wrapper: withProvider(),
    });
    await result.current.mutateAsync({ companyName: "STRABB", timezone: "Australia/Sydney" });

    expect(putMock).toHaveBeenCalledWith("/settings/general", {
      companyName: "STRABB",
      timezone: "Australia/Sydney",
    });
  });
});
