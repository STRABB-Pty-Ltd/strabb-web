import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ get: getMock }),
  useAuthReady: () => true,
}));

import { useVacancyAPI } from "./vacancy-api";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

describe("useVacancyAPI", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("propagates listings, dates, and minGapDays to the URL", async () => {
    getMock.mockResolvedValue({ data: [] });
    const { result } = renderHook(
      () => useVacancyAPI(["lst-1", "lst-2"], "2026-05-01", "2026-05-31", 3),
      { wrapper: withProvider() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getMock.mock.calls[0][0] as string;
    expect(url).toMatch(/^\/vacancy\?/);
    expect(url).toMatch(/listing_ids=lst-1/);
    expect(url).toMatch(/listing_ids=lst-2/);
    expect(url).toMatch(/start_date=2026-05-01/);
    expect(url).toMatch(/end_date=2026-05-31/);
    expect(url).toMatch(/min_gap_days=3/);
  });

  it("omits date / gap params when not provided", async () => {
    getMock.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useVacancyAPI([]), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getMock.mock.calls[0][0] as string;
    expect(url).not.toMatch(/start_date=/);
    expect(url).not.toMatch(/end_date=/);
    expect(url).not.toMatch(/min_gap_days=/);
  });

  it("returns the unwrapped Vacancy[] from the response envelope", async () => {
    const vacancies = [
      {
        listingId: "lst-1",
        listingName: "Beach House",
        start: "2026-05-10",
        end: "2026-05-12",
        nights: 2,
      },
    ];
    getMock.mockResolvedValue({ data: vacancies });
    const { result } = renderHook(() => useVacancyAPI(["lst-1"]), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(vacancies);
  });
});
