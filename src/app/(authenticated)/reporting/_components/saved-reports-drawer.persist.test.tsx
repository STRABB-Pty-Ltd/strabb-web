import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, postMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ get: getMock, post: postMock, put: vi.fn(), delete: deleteMock }),
  useAuthReady: () => true,
}));

import { useAppStore } from "@/stores/app-store";

import { SavedReportsDrawer } from "./saved-reports-drawer";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

// A realistic GET /saved-reports payload, already camelCased by the api client.
const apiReport = {
  id: "sr-1",
  userId: "u-1",
  name: "Q1 Review",
  timeframe: "quarter",
  submenu: ["revenue"],
  listingIds: [],
  configJson: {},
  createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-06-01T00:00:00Z",
};

describe("SavedReportsDrawer integration (real useSavedReports)", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    deleteMock.mockReset();
    useAppStore.setState(useAppStore.getInitialState());
  });

  it("click-to-load applies the saved report's timeframe + submenu to the reporting view", async () => {
    getMock.mockResolvedValue({ data: [apiReport] });
    render(<SavedReportsDrawer />, { wrapper: withProvider() });

    await screen.findByText("Q1 Review");
    await userEvent.click(screen.getByRole("button", { name: /load/i }));

    await waitFor(() => {
      const reporting = useAppStore.getState().reporting;
      expect(reporting.windowSize).toBe("quarter");
      expect(reporting.submenu).toEqual(["revenue"]);
      expect(reporting.activeSavedReport).toBe("sr-1");
    });
  });

  it("save persists the current view via POST /saved-reports", async () => {
    getMock.mockResolvedValue({ data: [] });
    postMock.mockResolvedValue({ data: {} });
    // Put the reporting view into a known non-default state first.
    useAppStore.getState().setTimeframe("reporting", "year");
    useAppStore.getState().setSubmenu("reporting", ["expenses"]);

    render(<SavedReportsDrawer />, { wrapper: withProvider() });

    await userEvent.click(screen.getByRole("button", { name: /save current/i }));
    await userEvent.type(screen.getByLabelText(/report name/i), "My Report");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith("/saved-reports", {
        name: "My Report",
        timeframe: "year",
        submenu: ["expenses"],
        listingIds: [],
        configJson: { anchor: null },
      }),
    );
  });
});
