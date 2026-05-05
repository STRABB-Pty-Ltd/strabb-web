import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SyncLogResponse } from "@/lib/schemas/admin";

const syncLogsMock = vi.fn();
const triggerMutate = vi.fn();
const triggerState = { isPending: false };
const addToastMock = vi.fn();

vi.mock("@/hooks/use-sync", () => ({
  useSyncLogs: () => syncLogsMock(),
  useTriggerSync: () => ({ mutate: triggerMutate, isPending: triggerState.isPending }),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

import SyncLogsPage from "./page";

function logFor(overrides: Partial<SyncLogResponse> = {}): SyncLogResponse {
  return {
    id: "log-1",
    listingId: "01234567-89ab-cdef-0123-456789abcdef",
    startedAt: "2026-04-25T10:00:00Z",
    completedAt: "2026-04-25T10:00:30Z",
    status: "synced",
    metrics: {
      bookingsCreated: 2,
      bookingsUpdated: 1,
      bookingsUnchanged: 5,
    },
    errorMessage: null,
    createdAt: "2026-04-25T10:00:00Z",
    ...overrides,
  };
}

describe("SyncLogsPage", () => {
  beforeEach(() => {
    syncLogsMock.mockReset();
    triggerMutate.mockReset();
    addToastMock.mockReset();
    triggerState.isPending = false;
  });

  it("renders the rate-limit hint and trigger button", () => {
    syncLogsMock.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 } },
      isLoading: false,
    });
    render(<SyncLogsPage />);
    expect(screen.getByText(/limited to 3 syncs per 5 minutes\./i)).toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: /trigger sync/i });
    expect(trigger).toHaveAttribute("title", "Limited to 3 syncs per 5 minutes");
    expect(trigger).toBeEnabled();
  });

  it("shows loading state", () => {
    syncLogsMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<SyncLogsPage />);
    expect(screen.getByText(/loading sync logs/i)).toBeInTheDocument();
  });

  it("renders log rows with bookings counts", () => {
    syncLogsMock.mockReturnValue({
      data: {
        data: [logFor()],
        meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
      },
      isLoading: false,
    });
    render(<SyncLogsPage />);
    expect(screen.getByText("synced")).toBeInTheDocument();
    expect(screen.getByText("2 / 1 / 5")).toBeInTheDocument();
  });

  it("renders empty state when no logs", () => {
    syncLogsMock.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 } },
      isLoading: false,
    });
    render(<SyncLogsPage />);
    expect(screen.getByText(/no sync runs yet/i)).toBeInTheDocument();
  });

  it("triggers a sync and shows success toast", async () => {
    syncLogsMock.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 } },
      isLoading: false,
    });
    triggerMutate.mockImplementation((_, { onSuccess }) =>
      onSuccess({
        listingsSynced: 3,
        listingsFailed: 0,
        bookingsCreated: 4,
        bookingsUpdated: 1,
        bookingsUnchanged: 7,
        conflictsDetected: 0,
      }),
    );

    render(<SyncLogsPage />);
    await userEvent.click(screen.getByRole("button", { name: /trigger sync/i }));

    expect(triggerMutate).toHaveBeenCalled();
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        message: expect.stringContaining("3 listings"),
      }),
    );
  });

  it("surfaces API errors in a toast", async () => {
    syncLogsMock.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 } },
      isLoading: false,
    });
    triggerMutate.mockImplementation((_, { onError }) => onError(new Error("Rate limited")));

    render(<SyncLogsPage />);
    await userEvent.click(screen.getByRole("button", { name: /trigger sync/i }));

    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error", message: "Rate limited" }),
    );
  });
});
