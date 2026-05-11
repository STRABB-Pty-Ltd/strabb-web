import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ get: getMock }),
  useAuthReady: () => true,
}));

import { useCalendarEventsAPI } from "./calendar-api";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

const rawEvent = {
  id: "evt-1",
  entityType: "booking",
  listingId: "lst-1",
  listingName: "Beach House",
  start: "2026-05-01T00:00:00Z",
  end: "2026-05-04T00:00:00Z",
  title: "Alice — 3 nights",
  status: "confirmed",
  color: "#000",
  metadata: { channel: "airbnb", guest: "Alice", amount: 600 },
  blockedChildren: null,
};

describe("useCalendarEventsAPI", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("overview (no filters) requests booking, cleaning, ticket types", async () => {
    getMock.mockResolvedValue({ data: [] });
    const { result } = renderHook(
      () => useCalendarEventsAPI(["lst-1"], [], "2026-05-01", "2026-05-31"),
      {
        wrapper: withProvider(),
      },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getMock.mock.calls[0][0] as string;
    expect(url).toMatch(/listing_ids=lst-1/);
    expect(url).toMatch(/types=booking/);
    expect(url).toMatch(/types=cleaning/);
    expect(url).toMatch(/types=ticket/);
    expect(url).not.toMatch(/types=vacancy/);
    expect(url).toMatch(/start_date=2026-05-01/);
    expect(url).toMatch(/end_date=2026-05-31/);
  });

  it("ticket submenu chip pulls bookings alongside so context shows up", async () => {
    getMock.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useCalendarEventsAPI([], ["ticket"]), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getMock.mock.calls[0][0] as string;
    expect(url).toMatch(/types=ticket/);
    expect(url).toMatch(/types=booking/);
  });

  it("maps RawCalendarEvent to CalendarEvent shape via metadata flattening", async () => {
    getMock.mockResolvedValue({ data: [rawEvent] });
    const { result } = renderHook(() => useCalendarEventsAPI([], []), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      {
        id: "evt-1",
        type: "booking",
        listingId: "lst-1",
        listingName: "Beach House",
        label: "Alice — 3 nights",
        start: "2026-05-01T00:00:00Z",
        end: "2026-05-04T00:00:00Z",
        color: "#000",
        channel: "airbnb",
        guest: "Alice",
        status: "confirmed",
        amount: 600,
      },
    ]);
  });
});
