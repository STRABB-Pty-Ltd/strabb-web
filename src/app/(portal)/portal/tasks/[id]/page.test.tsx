import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";
import type { PortalTask } from "@/lib/schemas/portal";

const usePortalTaskMock = vi.fn();
const useTransitionTaskMock = vi.fn();
const mutateMock = vi.fn();
const addToastMock = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "task-1" }),
}));

vi.mock("@/lib/api-hooks/portal-api", () => ({
  usePortalTask: () => usePortalTaskMock(),
  useTransitionTask: () => useTransitionTaskMock(),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

import PortalTaskDetailPage from "./page";

function task(overrides: Partial<PortalTask> = {}): PortalTask {
  return {
    id: "task-1",
    listingId: "l1",
    listingName: "Beach House",
    propertyId: "p1",
    taskType: "turnover",
    priority: "medium",
    status: "confirmed",
    // A full UTC datetime, as the api's PortalTaskResponse.scheduled_date sends.
    scheduledDate: "2026-08-07T02:55:19Z",
    scheduledTime: null,
    estimatedHours: 2,
    actualHours: null,
    checklistTotal: 5,
    checklistDone: 2,
    notes: null,
    completedAt: null,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("PortalTaskDetailPage", () => {
  beforeEach(() => {
    usePortalTaskMock.mockReset();
    useTransitionTaskMock.mockReset().mockReturnValue({ mutate: mutateMock, isPending: false });
    mutateMock.mockReset();
    addToastMock.mockReset();
  });

  it("offers Accept for a confirmed task and dispatches an accept transition", async () => {
    usePortalTaskMock.mockReturnValue({ data: task({ status: "confirmed" }), isLoading: false });
    render(<PortalTaskDetailPage />);
    const button = screen.getByRole("button", { name: /accept clean/i });
    await userEvent.click(button);
    expect(mutateMock).toHaveBeenCalledWith({ action: "accept" }, expect.any(Object));
  });

  it("renders the scheduled datetime as a readable local time, not raw ISO", () => {
    usePortalTaskMock.mockReturnValue({ data: task({ status: "confirmed" }), isLoading: false });
    render(<PortalTaskDetailPage />);
    // 02:55 UTC -> 12:55 pm in Australia/Sydney (AEST, UTC+10) on 7 Aug.
    expect(screen.getByText(/7 Aug, 12:55\s*pm/i)).toBeInTheDocument();
    expect(screen.queryByText(/2026-08-07T02:55:19Z/)).not.toBeInTheDocument();
  });

  it("offers Start for an accepted task", () => {
    usePortalTaskMock.mockReturnValue({ data: task({ status: "accepted" }), isLoading: false });
    render(<PortalTaskDetailPage />);
    expect(screen.getByRole("button", { name: /start clean/i })).toBeInTheDocument();
  });

  it("pre-fills actual hours from the estimate and completes with the hours + note", async () => {
    usePortalTaskMock.mockReturnValue({
      data: task({ status: "in_progress", estimatedHours: 3 }),
      isLoading: false,
    });
    render(<PortalTaskDetailPage />);

    const hoursInput = screen.getByLabelText(/actual hours/i) as HTMLInputElement;
    expect(hoursInput.value).toBe("3");

    const note = screen.getByLabelText(/note/i);
    await userEvent.type(note, "Left keys in lockbox");
    await userEvent.click(screen.getByRole("button", { name: /mark complete/i }));

    expect(mutateMock).toHaveBeenCalledWith(
      { action: "complete", actualHours: 3, notes: "Left keys in lockbox" },
      expect.any(Object),
    );
  });

  it("shows an error toast (not a silent success) when a transition 409s", async () => {
    usePortalTaskMock.mockReturnValue({ data: task({ status: "confirmed" }), isLoading: false });
    mutateMock.mockImplementation((_payload, opts) => {
      opts.onError(new ApiError(409, "Task already completed"));
    });
    render(<PortalTaskDetailPage />);
    await userEvent.click(screen.getByRole("button", { name: /accept clean/i }));
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        message: expect.stringMatching(/already updated/i),
      }),
    );
  });

  it("shows no action button for a completed task", () => {
    usePortalTaskMock.mockReturnValue({ data: task({ status: "completed" }), isLoading: false });
    render(<PortalTaskDetailPage />);
    expect(screen.queryByRole("button", { name: /clean/i })).not.toBeInTheDocument();
    expect(screen.getByText(/this clean is complete/i)).toBeInTheDocument();
  });
});
