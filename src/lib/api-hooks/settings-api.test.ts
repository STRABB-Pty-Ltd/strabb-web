import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, putMock, addToastMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  putMock: vi.fn(),
  addToastMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ get: getMock, put: putMock }),
  useAuthReady: () => true,
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

import {
  useSettingsForm,
  useSettingsSectionAPI,
  useUpdateSettingsSectionAPI,
} from "./settings-api";

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

const FORM_DEFAULTS = { companyName: "STRABB Properties", timezone: "Australia/Sydney" };

describe("useSettingsForm", () => {
  beforeEach(() => {
    getMock.mockReset();
    putMock.mockReset();
    addToastMock.mockReset();
  });

  it("falls back to defaults when the server has no saved settings", async () => {
    getMock.mockResolvedValue({ data: { settings: {} } });

    const { result } = renderHook(() => useSettingsForm("general", FORM_DEFAULTS), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    expect(result.current.values).toEqual(FORM_DEFAULTS);
    expect(result.current.dirty).toBe(false);
  });

  it("merges saved server values over defaults, leaving unset keys at default", async () => {
    getMock.mockResolvedValue({ data: { settings: { companyName: "Acme Co" } } });

    const { result } = renderHook(() => useSettingsForm("general", FORM_DEFAULTS), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.values.companyName).toBe("Acme Co"));

    expect(result.current.values.timezone).toBe("Australia/Sydney");
    expect(result.current.dirty).toBe(false);
  });

  it("patch makes the section dirty and edits win over server values", async () => {
    getMock.mockResolvedValue({ data: { settings: { companyName: "Acme Co" } } });

    const { result } = renderHook(() => useSettingsForm("general", FORM_DEFAULTS), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.values.companyName).toBe("Acme Co"));

    act(() => result.current.patch({ companyName: "Edited" }));

    expect(result.current.values.companyName).toBe("Edited");
    expect(result.current.dirty).toBe(true);
  });

  it("save PUTs merged values wrapped under settings, then clears dirty and toasts success", async () => {
    getMock.mockResolvedValue({ data: { settings: {} } });
    putMock.mockResolvedValue({ data: { settings: {} } });

    const { result } = renderHook(() => useSettingsForm("general", FORM_DEFAULTS), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    act(() => result.current.patch({ companyName: "Edited" }));
    expect(result.current.dirty).toBe(true);

    act(() => result.current.save());

    await waitFor(() =>
      expect(putMock).toHaveBeenCalledWith("/settings/general", {
        settings: { companyName: "Edited", timezone: "Australia/Sydney" },
      }),
    );
    await waitFor(() => expect(result.current.dirty).toBe(false));
    expect(addToastMock).toHaveBeenCalledWith({ type: "success", message: "Settings saved" });
  });

  it("surfaces a save failure as an error toast and stays dirty", async () => {
    getMock.mockResolvedValue({ data: { settings: {} } });
    putMock.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useSettingsForm("general", FORM_DEFAULTS), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    act(() => result.current.patch({ companyName: "Edited" }));
    act(() => result.current.save());

    await waitFor(() =>
      expect(addToastMock).toHaveBeenCalledWith({ type: "error", message: "boom" }),
    );
    expect(result.current.dirty).toBe(true);
  });
});
