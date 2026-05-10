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
  useCleaningTasksAPI,
  useCreateCleaningTaskAPI,
  useShoppingListAPI,
  useUpdateCleaningTaskAPI,
} from "./cleaning-api";

function withProvider(): (props: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

const rawTask = {
  id: "ct-1",
  bookingId: null,
  propertyId: "prop-1",
  listingId: "lst-1",
  cleanerName: null,
  cleanerEmail: null,
  scheduledDate: "2026-05-02",
  scheduledTime: null,
  status: "pending",
  notes: null,
  taskType: "checkout",
  priority: "medium",
  estimatedHours: 2,
  checklistTotal: 10,
  checklistDone: 0,
  cost: null,
};

describe("cleaning-api hooks", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
  });

  it("useCleaningTasksAPI with overview filter omits status param", async () => {
    getMock.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useCleaningTasksAPI(["overview"], ["lst-1"]), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getMock.mock.calls[0][0] as string;
    expect(url).toMatch(/listing_id=lst-1/);
    expect(url).not.toMatch(/status=/);
  });

  it("useCleaningTasksAPI maps 'archived' submenu chip to 'completed' status", async () => {
    getMock.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useCleaningTasksAPI(["archived"], []), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getMock.mock.calls[0][0] as string;
    expect(url).toMatch(/status=completed/);
  });

  it("useCleaningTasksAPI maps RawCleaningTask scheduledDate fallback into scheduledTime", async () => {
    getMock.mockResolvedValue({ data: [rawTask] });
    const { result } = renderHook(() => useCleaningTasksAPI([], []), { wrapper: withProvider() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0]).toMatchObject({
      id: "ct-1",
      scheduledTime: "2026-05-02",
      type: "checkout",
      status: "pending",
    });
  });

  it("useShoppingListAPI passes listing_id params to /cleaning-tasks/shopping-list", async () => {
    getMock.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useShoppingListAPI(["lst-1", "lst-2"]), {
      wrapper: withProvider(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = getMock.mock.calls[0][0] as string;
    expect(url).toMatch(/^\/cleaning-tasks\/shopping-list\?/);
    expect(url).toMatch(/listing_id=lst-1/);
    expect(url).toMatch(/listing_id=lst-2/);
  });

  it("create / update mutations target the cleaning-tasks endpoint", async () => {
    postMock.mockResolvedValue({ data: { id: "ct-new" } });
    patchMock.mockResolvedValue({ data: { id: "ct-1" } });

    const create = renderHook(() => useCreateCleaningTaskAPI(), { wrapper: withProvider() });
    await create.result.current.mutateAsync({ listingId: "lst-1" });
    expect(postMock).toHaveBeenCalledWith("/cleaning-tasks", { listingId: "lst-1" });

    const update = renderHook(() => useUpdateCleaningTaskAPI(), { wrapper: withProvider() });
    await update.result.current.mutateAsync({ id: "ct-1", data: { status: "completed" } });
    expect(patchMock).toHaveBeenCalledWith("/cleaning-tasks/ct-1", { status: "completed" });
  });
});
