import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SyncLogResponse } from "@/lib/schemas/admin";
import type { ScheduledMessageResponse } from "@/lib/schemas/message";

const { healthMock, syncErrorsMock, failedMessagesMock, resendMutate, addToastMock } = vi.hoisted(
  () => ({
    healthMock: vi.fn(),
    syncErrorsMock: vi.fn(),
    failedMessagesMock: vi.fn(),
    resendMutate: vi.fn(),
    addToastMock: vi.fn(),
  }),
);

vi.mock("@/hooks/use-admin", () => ({
  useSystemHealth: () => healthMock(),
  useSyncErrors: () => syncErrorsMock(),
  useFailedMessages: () => failedMessagesMock(),
}));

vi.mock("@/hooks/use-messages", () => ({
  useResendMessage: () => ({ mutate: resendMutate, isPending: false }),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

import AdminPage from "./page";

const aSyncError: SyncLogResponse = {
  id: "sync-1",
  listingId: "11111111-1111-1111-1111-111111111111",
  startedAt: "2026-04-25T00:00:00Z",
  completedAt: "2026-04-25T00:01:00Z",
  status: "failed",
  metrics: {
    bookingsCreated: 0,
    bookingsUpdated: 0,
    bookingsUnchanged: 5,
  },
  errorMessage: "Timeout reaching feed",
  createdAt: "2026-04-25T00:00:00Z",
};

const aFailedMessage: ScheduledMessageResponse = {
  id: "msg-1",
  bookingId: "book-1",
  templateName: "checkin",
  scheduledFor: "2026-04-26T08:00:00Z",
  status: "failed",
  recipientEmail: "guest@example.com",
  subject: "Check-in info",
  body: null,
  sentAt: null,
  errorMessage: "SMTP rejected",
  retryCount: 3,
  createdAt: "2026-04-25T00:00:00Z",
  updatedAt: "2026-04-25T00:00:00Z",
};

describe("AdminPage", () => {
  beforeEach(() => {
    healthMock.mockReset();
    syncErrorsMock.mockReset();
    failedMessagesMock.mockReset();
    resendMutate.mockReset();
    addToastMock.mockReset();

    healthMock.mockReturnValue({
      data: {
        syncErrors: 1,
        listingsErrored: 0,
        tasksFailed: 0,
        messagesFailed: 1,
        notificationFailures: 0,
        hasIssues: true,
      },
      isLoading: false,
    });
    syncErrorsMock.mockReturnValue({ data: { data: [aSyncError] }, isLoading: false });
    failedMessagesMock.mockReturnValue({ data: { data: [aFailedMessage] }, isLoading: false });
  });

  it("renders health cards plus sync errors and failed messages tables", () => {
    render(<AdminPage />);

    expect(screen.getByText(/recent sync errors/i)).toBeInTheDocument();
    expect(screen.getByText(/timeout reaching feed/i)).toBeInTheDocument();

    expect(screen.getByText(/failed messages/i)).toBeInTheDocument();
    expect(screen.getByText(aFailedMessage.recipientEmail)).toBeInTheDocument();
    expect(screen.getByText(/smtp rejected/i)).toBeInTheDocument();
  });

  it("Resend button on a failed message fires the resend mutation", async () => {
    render(<AdminPage />);
    await userEvent.click(screen.getByRole("button", { name: /resend/i }));
    expect(resendMutate).toHaveBeenCalledWith(aFailedMessage.id, expect.any(Object));
  });

  it("renders empty states when there are no entries", () => {
    syncErrorsMock.mockReturnValue({ data: { data: [] }, isLoading: false });
    failedMessagesMock.mockReturnValue({ data: { data: [] }, isLoading: false });
    render(<AdminPage />);
    expect(screen.getByText(/no recent sync errors/i)).toBeInTheDocument();
    expect(screen.getByText(/no failed messages/i)).toBeInTheDocument();
  });
});
