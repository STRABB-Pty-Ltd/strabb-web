import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();
const patchMock = vi.fn();

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({
    get: getMock,
    post: postMock,
    patch: patchMock,
  }),
  useAuthReady: () => true,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { accessToken: "mock" }, status: "authenticated" }),
}));

import { useBooking, useDismissConflict, useUpdateBookingNotes } from "./use-bookings";

function makeWrapper(): {
  client: QueryClient;
  Wrapper: (props: { children: ReactNode }) => ReactNode;
} {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return { client, Wrapper };
}

describe("use-bookings hooks", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
  });

  it("useBooking does not fetch when id is null", () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useBooking(null), { wrapper: Wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("useBooking fetches /bookings/{id} and unwraps data", async () => {
    getMock.mockResolvedValue({
      data: {
        id: "book-1",
        listingId: "lst-1",
        propertyId: "prop-1",
        guestId: null,
        externalBookingId: null,
        idempotencyKey: "abc",
        checkIn: "2026-04-26T15:00:00Z",
        checkOut: "2026-04-29T11:00:00Z",
        status: "confirmed",
        conflictStatus: "clear",
        source: "airbnb",
        guestName: null,
        guestEmail: null,
        rawSummary: null,
        notes: null,
        createdAt: "2026-04-20T00:00:00Z",
        updatedAt: "2026-04-20T00:00:00Z",
      },
    });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useBooking("book-1"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/bookings/book-1");
    expect(result.current.data?.id).toBe("book-1");
  });

  it("useDismissConflict POSTs and invalidates bookings queries", async () => {
    postMock.mockResolvedValue({ data: { id: "book-1" } });

    const { client, Wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useDismissConflict(), { wrapper: Wrapper });
    await result.current.mutateAsync("book-1");

    expect(postMock).toHaveBeenCalledWith("/bookings/book-1/dismiss-conflict", {});
    const invalidatedKeys = invalidateSpy.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(["bookings"]);
  });

  it("useUpdateBookingNotes PATCHes notes", async () => {
    patchMock.mockResolvedValue({ data: { id: "book-1" } });

    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateBookingNotes(), { wrapper: Wrapper });
    await result.current.mutateAsync({ id: "book-1", notes: "hello" });

    expect(patchMock).toHaveBeenCalledWith("/bookings/book-1/notes", { notes: "hello" });
  });
});
