import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CleaningTaskResponse } from "@/lib/schemas/cleaning-task";

const addToastMock = vi.fn();
const closeDrillDownPanelMock = vi.fn();

const storeState = {
  drillDownPanel: null as { open: boolean; type: string; itemId: string } | null,
  closeDrillDownPanel: closeDrillDownPanelMock,
  addToast: addToastMock,
};

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: typeof storeState) => unknown) => selector(storeState),
}));

const taskMock = vi.fn();
const completeMock = vi.fn();
const resendMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/hooks/use-cleaning-tasks", () => ({
  useCleaningTask: () => taskMock(),
  useCompleteCleaningTask: () => ({ mutate: completeMock, isPending: false }),
  useResendNotification: () => ({ mutate: resendMock, isPending: false }),
  useUpdateCleaningTask: () => ({ mutate: updateMock, isPending: false }),
}));

import { CleaningDetailDrawer } from "./cleaning-detail-drawer";

const baseTask: CleaningTaskResponse = {
  id: "task-1",
  bookingId: "book-1",
  propertyId: "prop-1",
  cleanerName: "Jane Cleaner",
  cleanerEmail: "jane@example.com",
  cleanerPhone: "+61400111222",
  scheduledDate: "2026-04-26T09:00:00Z",
  status: "scheduled",
  notes: "Bring eco supplies",
  createdAt: "2026-04-20T00:00:00Z",
  updatedAt: "2026-04-20T00:00:00Z",
};

describe("CleaningDetailDrawer", () => {
  beforeEach(() => {
    addToastMock.mockReset();
    closeDrillDownPanelMock.mockReset();
    completeMock.mockReset();
    resendMock.mockReset();
    updateMock.mockReset();
    taskMock.mockReset();
    storeState.drillDownPanel = null;
  });

  it("renders nothing when drill-down is not a cleaning task", () => {
    storeState.drillDownPanel = { open: true, type: "revenue", itemId: "foo" };
    taskMock.mockReturnValue({ data: null, isLoading: false });
    const { container } = render(<CleaningDetailDrawer />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders task details when cleaning drill-down is open", () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({ data: baseTask, isLoading: false });
    render(<CleaningDetailDrawer />);

    expect(screen.getByText("Jane Cleaner")).toBeInTheDocument();
    expect(screen.getByText(baseTask.cleanerEmail!)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark complete/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /resend notification/i })).toBeEnabled();
  });

  it("disables Mark complete for completed tasks", () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({
      data: { ...baseTask, status: "completed" },
      isLoading: false,
    });
    render(<CleaningDetailDrawer />);

    expect(screen.getByRole("button", { name: /mark complete/i })).toBeDisabled();
  });

  it("disables Resend when cleaner has no email", () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({
      data: { ...baseTask, cleanerEmail: null },
      isLoading: false,
    });
    render(<CleaningDetailDrawer />);

    expect(screen.getByRole("button", { name: /resend notification/i })).toBeDisabled();
  });

  it("calls complete mutation when Mark complete clicked", async () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({ data: baseTask, isLoading: false });
    render(<CleaningDetailDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /mark complete/i }));
    expect(completeMock).toHaveBeenCalledWith(baseTask.id, expect.any(Object));
  });

  it("switches to edit mode and saves via update mutation", async () => {
    storeState.drillDownPanel = { open: true, type: "cleaning", itemId: baseTask.id };
    taskMock.mockReturnValue({ data: baseTask, isLoading: false });
    render(<CleaningDetailDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: baseTask.id,
        data: expect.objectContaining({ cleanerName: "Jane Cleaner" }),
      }),
      expect.any(Object),
    );
  });
});
