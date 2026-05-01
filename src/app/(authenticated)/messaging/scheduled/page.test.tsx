import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MessageLogResponse, ScheduledMessageResponse } from "@/lib/schemas/message";

const { addToastMock, scheduledMock, logsMock, resendMutate } = vi.hoisted(() => ({
  addToastMock: vi.fn(),
  scheduledMock: vi.fn(),
  logsMock: vi.fn(),
  resendMutate: vi.fn(),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

vi.mock("@/hooks/use-messages", () => ({
  useScheduledMessages: (...args: unknown[]) => scheduledMock(...args),
  useMessageLogs: (...args: unknown[]) => logsMock(...args),
  useResendMessage: () => ({ mutate: resendMutate, isPending: false }),
}));

const routerReplaceMock = vi.fn();
let searchParamsValue = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock, push: vi.fn() }),
  usePathname: () => "/messaging/scheduled",
  useSearchParams: () => searchParamsValue,
}));

import ScheduledMessagesPage from "./page";

const aMessage: ScheduledMessageResponse = {
  id: "msg-1",
  bookingId: "book-1",
  templateName: "checkin_instructions",
  scheduledFor: "2026-04-30T09:00:00Z",
  status: "pending",
  recipientEmail: "guest@example.com",
  subject: "Welcome",
  body: "...",
  sentAt: null,
  errorMessage: null,
  retryCount: 0,
  createdAt: "2026-04-25T00:00:00Z",
  updatedAt: "2026-04-25T00:00:00Z",
};

const aLog: MessageLogResponse = {
  id: "log-1",
  scheduledMessageId: "msg-1",
  event: "send_attempted",
  details: "Sent via SendGrid",
  providerResponse: "{ ok: true }",
  createdAt: "2026-04-25T00:00:00Z",
};

describe("ScheduledMessagesPage", () => {
  beforeEach(() => {
    addToastMock.mockReset();
    scheduledMock.mockReset();
    logsMock.mockReset();
    resendMutate.mockReset();

    scheduledMock.mockReturnValue({
      data: { data: [aMessage], meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 } },
      isLoading: false,
    });
    logsMock.mockReturnValue({
      data: { data: [aLog], meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 } },
      isLoading: false,
    });
  });

  it("renders Scheduled tab by default with status=pending", () => {
    render(<ScheduledMessagesPage />);

    const firstCall = scheduledMock.mock.calls[0]?.[0];
    expect(firstCall).toEqual(expect.objectContaining({ status: "pending", page: 1 }));
    expect(screen.getByText(aMessage.recipientEmail)).toBeInTheDocument();
  });

  it("switching to Failed tab requeries with status=failed", async () => {
    render(<ScheduledMessagesPage />);
    await userEvent.click(screen.getByRole("button", { name: "Failed" }));

    const lastCall = scheduledMock.mock.calls.at(-1)?.[0];
    expect(lastCall).toEqual(expect.objectContaining({ status: "failed", page: 1 }));
  });

  it("switching to Logs tab uses the logs hook", async () => {
    render(<ScheduledMessagesPage />);
    await userEvent.click(screen.getByRole("button", { name: "Logs" }));

    expect(logsMock).toHaveBeenCalled();
    expect(screen.getByText("send_attempted")).toBeInTheDocument();
  });

  it("Resend button fires the mutation", async () => {
    render(<ScheduledMessagesPage />);
    await userEvent.click(screen.getByRole("button", { name: /resend/i }));

    expect(resendMutate).toHaveBeenCalledWith(aMessage.id, expect.any(Object));
  });

  it("expanding a log entry shows provider response", async () => {
    render(<ScheduledMessagesPage />);
    await userEvent.click(screen.getByRole("button", { name: "Logs" }));
    await userEvent.click(screen.getByRole("button", { name: /send_attempted/ }));

    expect(screen.getByText("Provider response")).toBeInTheDocument();
    expect(screen.getByText("{ ok: true }")).toBeInTheDocument();
  });
});
