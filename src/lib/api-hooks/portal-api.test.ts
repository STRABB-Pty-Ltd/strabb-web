import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";
import type { PortalTask } from "@/lib/schemas/portal";

const { getMock, postMock, putMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/hooks/use-api-client", () => ({
  useApiClient: () => ({ get: getMock, post: postMock, put: putMock, delete: deleteMock }),
  useAuthReady: () => true,
}));

import {
  portalTaskKey,
  usePortalTask,
  usePortalTasks,
  useAddTimeOff,
  useAvailability,
  useDeleteTimeOff,
  useTransitionTask,
  useUpdateWeeklyAvailability,
} from "./portal-api";

function makeTask(overrides: Partial<PortalTask> = {}): PortalTask {
  return {
    id: "task-1",
    listingId: "listing-1",
    listingName: "Beach House",
    propertyId: "prop-1",
    taskType: "turnover",
    priority: "medium",
    status: "confirmed",
    scheduledDate: "2026-07-03",
    scheduledTime: "10:00",
    estimatedHours: 2,
    actualHours: null,
    checklistTotal: 5,
    checklistDone: 0,
    notes: null,
    completedAt: null,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

function newClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function providerFor(client: QueryClient): (props: { children: ReactNode }) => ReactNode {
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  Wrapper.displayName = "TestQueryProvider";
  return Wrapper;
}

describe("portal-api queries", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset().mockResolvedValue(undefined);
    putMock.mockReset().mockResolvedValue(undefined);
    deleteMock.mockReset().mockResolvedValue(undefined);
  });

  it("usePortalTasks requests the window + status filters and unwraps { data }", async () => {
    getMock.mockResolvedValue({ data: [makeTask()] });
    const { result } = renderHook(() => usePortalTasks("today", "confirmed"), {
      wrapper: providerFor(newClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/portal/tasks?window=today&status=confirmed");
    expect(result.current.data).toHaveLength(1);
  });

  it("usePortalTasks omits the status param when none is given", async () => {
    getMock.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => usePortalTasks("upcoming"), {
      wrapper: providerFor(newClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/portal/tasks?window=upcoming");
    expect(result.current.data).toEqual([]);
  });

  it("usePortalTask fetches a single task by id and unwraps { data }", async () => {
    getMock.mockResolvedValue({ data: makeTask({ id: "task-9" }) });
    const { result } = renderHook(() => usePortalTask("task-9"), {
      wrapper: providerFor(newClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/portal/tasks/task-9");
    expect(result.current.data?.id).toBe("task-9");
  });
});

describe("useTransitionTask optimistic update + rollback", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
  });

  it("optimistically advances the cached status before the request resolves", async () => {
    const client = newClient();
    client.setQueryData(portalTaskKey("task-1"), makeTask({ status: "confirmed" }));

    // A deferred promise lets us observe the cache mid-flight, after onMutate
    // but before the api responds.
    let resolvePost: (value: PortalTask) => void = () => {};
    postMock.mockReturnValue(
      new Promise<PortalTask>((resolve) => {
        resolvePost = resolve;
      }),
    );

    const { result } = renderHook(() => useTransitionTask("task-1"), {
      wrapper: providerFor(client),
    });
    result.current.mutate({ action: "accept" });

    await waitFor(() =>
      expect(client.getQueryData<PortalTask>(portalTaskKey("task-1"))?.status).toBe("accepted"),
    );
    expect(postMock).toHaveBeenCalledWith("/portal/tasks/task-1/transition", { action: "accept" });

    resolvePost(makeTask({ status: "accepted" }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls the cache back to the prior status on a 409 (stale transition)", async () => {
    const client = newClient();
    client.setQueryData(portalTaskKey("task-1"), makeTask({ status: "confirmed" }));
    postMock.mockRejectedValue(new ApiError(409, "Task already completed"));

    const { result } = renderHook(() => useTransitionTask("task-1"), {
      wrapper: providerFor(client),
    });
    result.current.mutate({ action: "accept" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // After rollback the optimistic "accepted" is reverted to "confirmed".
    expect(client.getQueryData<PortalTask>(portalTaskKey("task-1"))?.status).toBe("confirmed");
  });

  it("passes actualHours + notes through on a complete", async () => {
    const client = newClient();
    client.setQueryData(portalTaskKey("task-1"), makeTask({ status: "in_progress" }));
    postMock.mockResolvedValue(makeTask({ status: "completed" }));

    const { result } = renderHook(() => useTransitionTask("task-1"), {
      wrapper: providerFor(client),
    });
    result.current.mutate({ action: "complete", actualHours: 2.5, notes: "All done" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postMock).toHaveBeenCalledWith("/portal/tasks/task-1/transition", {
      action: "complete",
      actualHours: 2.5,
      notes: "All done",
    });
  });
});

describe("portal-api availability mutations", () => {
  beforeEach(() => {
    putMock.mockReset().mockResolvedValue(undefined);
    postMock.mockReset().mockResolvedValue(undefined);
    deleteMock.mockReset().mockResolvedValue(undefined);
    getMock.mockReset();
  });

  it("useAvailability unwraps the { data } envelope", async () => {
    getMock.mockResolvedValue({ data: { weekly: [], timeOff: [] } });
    const { result } = renderHook(() => useAvailability(), { wrapper: providerFor(newClient()) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getMock).toHaveBeenCalledWith("/portal/availability");
    expect(result.current.data).toEqual({ weekly: [], timeOff: [] });
  });

  it("useUpdateWeeklyAvailability PUTs the full replace-set as a bare array", async () => {
    const { result } = renderHook(() => useUpdateWeeklyAvailability(), {
      wrapper: providerFor(newClient()),
    });
    const weekly = [{ weekday: 0, startTime: "09:00", endTime: "17:00" }];
    result.current.mutate(weekly);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // The api binds `slots: list[WeeklyAvailabilitySlot]` directly, so the body
    // must be the bare array, not wrapped under a { weekly } key (that 422s).
    expect(putMock).toHaveBeenCalledWith("/portal/availability/weekly", weekly);
    const [, body] = putMock.mock.calls[0];
    expect(Array.isArray(body)).toBe(true);
  });

  it("useUpdateWeeklyAvailability clears the set with an empty array", async () => {
    const { result } = renderHook(() => useUpdateWeeklyAvailability(), {
      wrapper: providerFor(newClient()),
    });
    result.current.mutate([]);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(putMock).toHaveBeenCalledWith("/portal/availability/weekly", []);
  });

  it("useAddTimeOff POSTs the block to /portal/availability/time-off", async () => {
    const { result } = renderHook(() => useAddTimeOff(), { wrapper: providerFor(newClient()) });
    const block = { startAt: "2026-07-10T00:00:00Z", endAt: "2026-07-12T00:00:00Z", note: "Away" };
    result.current.mutate(block);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postMock).toHaveBeenCalledWith("/portal/availability/time-off", block);
  });

  it("useDeleteTimeOff DELETEs the block by id", async () => {
    const { result } = renderHook(() => useDeleteTimeOff(), { wrapper: providerFor(newClient()) });
    result.current.mutate("off-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteMock).toHaveBeenCalledWith("/portal/availability/time-off/off-1");
  });
});
