import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// These tests lock in the reporting *request wiring* - that the owner's
// listing filter + picked period actually reach every /reporting/* call.
// They are the regression guard for the "empty report" bug where every call
// went out as current-month / all-listings.

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ get: getMock, post: vi.fn(), put: vi.fn(), delete: vi.fn() }),
  useAuthReady: () => true,
}));

import { useReportingChartDataAPI, useReportingKPIsAPI } from "./reporting-api";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

const KPI_PAYLOAD = {
  revenue: 0,
  expenses: 0,
  net_income: 0,
  occupancy_rate: 0,
  avg_nightly_rate: 0,
  total_bookings: 0,
  previous: {},
  trends: {},
};

describe("reporting request wiring", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("KPIs: sends the picked listing AND the May range together", async () => {
    getMock.mockResolvedValue({ data: KPI_PAYLOAD });
    renderHook(() => useReportingKPIsAPI(["lst-lodge"], "month", "2026-05-01"), {
      wrapper: withProvider(),
    });

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    const url = getMock.mock.calls[0][0] as string;
    expect(url).toContain("/reporting/kpis");
    expect(url).toContain("listing_ids=lst-lodge");
    expect(url).toContain("start_date=2026-05-01");
    expect(url).toContain("end_date=2026-05-31");
  });

  it("charts: every current-period call carries the listing + May range", async () => {
    getMock.mockResolvedValue({ data: [] });
    renderHook(() => useReportingChartDataAPI(["lst-lodge"], "month", "2026-05-01"), {
      wrapper: withProvider(),
    });

    await waitFor(() => expect(getMock.mock.calls.length).toBeGreaterThanOrEqual(5));
    const urls = getMock.mock.calls.map((c) => c[0] as string);
    for (const path of [
      "/reporting/occupancy",
      "/reporting/revenue-breakdown",
      "/reporting/expense-breakdown",
      "/reporting/financials",
    ]) {
      const url = urls.find((u) => u.startsWith(path));
      expect(url, `${path} was requested`).toBeDefined();
      expect(url).toContain("listing_ids=lst-lodge");
      expect(url).toContain("start_date=2026-05-01");
      expect(url).toContain("end_date=2026-05-31");
    }
  });

  it("sends multiple listing_ids when several listings are selected", async () => {
    getMock.mockResolvedValue({ data: KPI_PAYLOAD });
    renderHook(() => useReportingKPIsAPI(["lst-lodge", "lst-cottage"], "month", "2026-05-01"), {
      wrapper: withProvider(),
    });

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    const url = getMock.mock.calls[0][0] as string;
    expect(url).toContain("listing_ids=lst-lodge");
    expect(url).toContain("listing_ids=lst-cottage");
  });

  it("omits listing_ids entirely when no listing is selected (whole-portfolio default)", async () => {
    getMock.mockResolvedValue({ data: KPI_PAYLOAD });
    renderHook(() => useReportingKPIsAPI([], "month", "2026-05-01"), { wrapper: withProvider() });

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    const url = getMock.mock.calls[0][0] as string;
    expect(url).not.toContain("listing_ids");
    expect(url).toContain("start_date=2026-05-01");
  });
});
