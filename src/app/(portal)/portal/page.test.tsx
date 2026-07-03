import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PortalTask } from "@/lib/schemas/portal";

const usePortalTasksMock = vi.fn();

vi.mock("@/lib/api-hooks/portal-api", () => ({
  usePortalTasks: (window: string, status?: string, options?: { enabled?: boolean }) =>
    usePortalTasksMock(window, status, options),
}));

import PortalTasksPage from "./page";

function task(overrides: Partial<PortalTask> = {}): PortalTask {
  return {
    id: "t1",
    listingId: "l1",
    listingName: "Beach House",
    propertyId: "p1",
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

function mockWindows(byWindow: Record<string, PortalTask[]>, isLoading = false) {
  usePortalTasksMock.mockImplementation((window: string) => ({
    data: byWindow[window] ?? [],
    isLoading,
  }));
}

describe("PortalTasksPage", () => {
  beforeEach(() => {
    usePortalTasksMock.mockReset();
  });

  it("renders the explicit empty state when no active cleans exist", () => {
    mockWindows({ today: [], upcoming: [], past: [] });
    render(<PortalTasksPage />);
    expect(screen.getByTestId("portal-tasks-empty")).toBeInTheDocument();
    expect(screen.getByText(/no cleans scheduled/i)).toBeInTheDocument();
  });

  it("groups tasks under Today and Upcoming with a status chip", () => {
    mockWindows({
      today: [task({ id: "today-1", listingName: "Today House" })],
      upcoming: [task({ id: "up-1", listingName: "Later House", status: "accepted" })],
      past: [],
    });
    render(<PortalTasksPage />);
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("Today House")).toBeInTheDocument();
    expect(screen.getByText("Later House")).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.queryByTestId("portal-tasks-empty")).not.toBeInTheDocument();
  });

  it("links each task to its detail page", () => {
    mockWindows({ today: [task({ id: "abc" })], upcoming: [], past: [] });
    render(<PortalTasksPage />);
    const link = screen.getByRole("link", { name: /beach house/i });
    expect(link).toHaveAttribute("href", "/portal/tasks/abc");
  });

  it("switches to the Past window and shows its own empty state", async () => {
    mockWindows({ today: [task()], upcoming: [], past: [] });
    render(<PortalTasksPage />);
    await userEvent.click(screen.getByRole("tab", { name: /past/i }));
    expect(screen.getByText(/no past cleans/i)).toBeInTheDocument();
  });
});
