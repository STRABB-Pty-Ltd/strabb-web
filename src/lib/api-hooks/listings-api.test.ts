import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, postMock, patchMock, putMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
  putMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({
    get: getMock,
    post: postMock,
    patch: patchMock,
    put: putMock,
    delete: deleteMock,
  }),
  useAuthReady: () => true,
}));

import {
  useCreateListingGroupAPI,
  useDeleteListingGroupAPI,
  useListingGroupsAPI,
  useListingsAPI,
  useListingsHierarchyAPI,
  useUpdateChannexMapping,
  useUpdateListingGroupAPI,
} from "./listings-api";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

describe("listings-api hooks", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
  });

  it("useListingsHierarchyAPI fetches /listings/hierarchy and unwraps envelope", async () => {
    const hierarchy = { properties: [{ id: "p1", name: "Beach", listings: [] }] };
    getMock.mockResolvedValue({ data: hierarchy });

    const { result } = renderHook(() => useListingsHierarchyAPI(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith("/listings/hierarchy");
    expect(result.current.data).toEqual(hierarchy);
  });

  it("useListingsAPI defaults to page_size=100 and returns the paginated envelope", async () => {
    const payload = {
      data: [],
      meta: { total: 0, page: 1, pageSize: 100, totalPages: 1 },
    };
    getMock.mockResolvedValue(payload);

    const { result } = renderHook(() => useListingsAPI(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith("/listings?page=1&page_size=100");
    expect(result.current.data).toEqual(payload);
  });

  it("useListingsAPI respects a custom page size", async () => {
    getMock.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, pageSize: 25, totalPages: 1 },
    });

    const { result } = renderHook(() => useListingsAPI(25), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getMock).toHaveBeenCalledWith("/listings?page=1&page_size=25");
  });

  it("useListingGroupsAPI returns the group list directly", async () => {
    getMock.mockResolvedValue({ data: [{ id: "g1", name: "All", listingIds: [] }] });
    const { result } = renderHook(() => useListingGroupsAPI(), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "g1", name: "All", listingIds: [] }]);
  });

  it("group mutations call /listing-groups with the right verb", async () => {
    postMock.mockResolvedValue({ data: { id: "g-new" } });
    putMock.mockResolvedValue({ data: { id: "g-1" } });
    deleteMock.mockResolvedValue(undefined);

    const create = renderHook(() => useCreateListingGroupAPI(), { wrapper: withProvider() });
    await create.result.current.mutateAsync({ name: "VIP", listingIds: ["lst-1"] });
    expect(postMock).toHaveBeenCalledWith("/listing-groups", {
      name: "VIP",
      listingIds: ["lst-1"],
    });

    const update = renderHook(() => useUpdateListingGroupAPI(), { wrapper: withProvider() });
    await update.result.current.mutateAsync({ id: "g-1", data: { name: "Top", listingIds: [] } });
    expect(putMock).toHaveBeenCalledWith("/listing-groups/g-1", { name: "Top", listingIds: [] });

    const del = renderHook(() => useDeleteListingGroupAPI(), { wrapper: withProvider() });
    await del.result.current.mutateAsync("g-1");
    expect(deleteMock).toHaveBeenCalledWith("/listing-groups/g-1");
  });

  it("useUpdateChannexMapping PATCHes the dedicated channex-mapping route", async () => {
    patchMock.mockResolvedValue({
      data: { id: "lst-1", channexPropertyId: "ch-1" },
    });

    const { result } = renderHook(() => useUpdateChannexMapping(), { wrapper: withProvider() });
    const updated = await result.current.mutateAsync({
      listingId: "lst-1",
      channexPropertyId: "ch-1",
    });

    expect(patchMock).toHaveBeenCalledWith("/listings/lst-1/channex-mapping", {
      channexPropertyId: "ch-1",
    });
    expect(updated).toEqual({ id: "lst-1", channexPropertyId: "ch-1" });
  });
});
