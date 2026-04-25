import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PhoneStatusResponse, SmsUsageSummaryResponse } from "@/lib/schemas/phone";

const addToastMock = vi.fn();

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: unknown) => unknown) =>
    selector({
      addToast: addToastMock,
    }),
}));

const statusMock = vi.fn();
const usageMock = vi.fn();
const requestMock = vi.fn();
const confirmMock = vi.fn();
const clearMock = vi.fn();

vi.mock("@/hooks/use-phone", () => ({
  usePhoneStatus: () => statusMock(),
  useSmsUsage: () => usageMock(),
  useRequestPhoneVerification: () => ({
    mutate: requestMock,
    isPending: false,
  }),
  useConfirmPhoneVerification: () => ({
    mutate: confirmMock,
    isPending: false,
  }),
  useClearPhone: () => ({
    mutate: clearMock,
    isPending: false,
  }),
}));

import { PhoneSection } from "./phone-section";

const noPhone: PhoneStatusResponse = {
  phoneNumber: null,
  phoneVerifiedAt: null,
  hasPending: false,
};

const pending: PhoneStatusResponse = {
  phoneNumber: null,
  phoneVerifiedAt: null,
  hasPending: true,
};

const verified: PhoneStatusResponse = {
  phoneNumber: "+61400000000",
  phoneVerifiedAt: "2026-04-20T00:00:00Z",
  hasPending: false,
};

const usage: SmsUsageSummaryResponse = {
  userTodayCount: 3,
  tenantTodayCount: 10,
  userDailyCap: 50,
  tenantDailyCap: 500,
  canSend: true,
};

describe("PhoneSection", () => {
  beforeEach(() => {
    addToastMock.mockReset();
    requestMock.mockReset();
    confirmMock.mockReset();
    clearMock.mockReset();
    statusMock.mockReset();
    usageMock.mockReset();
    usageMock.mockReturnValue({ data: usage, isLoading: false });
  });

  it("shows phone entry when no phone is set", () => {
    statusMock.mockReturnValue({ data: noPhone, isLoading: false });
    render(<PhoneSection />);

    expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send code/i })).toBeInTheDocument();
  });

  it("shows OTP input when verification is pending", () => {
    statusMock.mockReturnValue({ data: pending, isLoading: false });
    render(<PhoneSection />);

    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^verify$/i })).toBeInTheDocument();
  });

  it("shows verified phone and remove action when verified", () => {
    statusMock.mockReturnValue({ data: verified, isLoading: false });
    render(<PhoneSection />);

    expect(screen.getByText(verified.phoneNumber!)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove phone/i })).toBeInTheDocument();
  });

  it("validates phone number before calling mutation", async () => {
    statusMock.mockReturnValue({ data: noPhone, isLoading: false });
    render(<PhoneSection />);

    const input = screen.getByLabelText(/mobile number/i);
    await userEvent.type(input, "123");
    await userEvent.click(screen.getByRole("button", { name: /send code/i }));

    expect(requestMock).not.toHaveBeenCalled();
    expect(screen.getByText(/at least 8/i)).toBeInTheDocument();
  });

  it("calls request mutation with valid phone", async () => {
    statusMock.mockReturnValue({ data: noPhone, isLoading: false });
    render(<PhoneSection />);

    const input = screen.getByLabelText(/mobile number/i);
    await userEvent.type(input, "+61400000000");
    await userEvent.click(screen.getByRole("button", { name: /send code/i }));

    expect(requestMock).toHaveBeenCalledWith("+61400000000", expect.any(Object));
  });

  it("calls confirm mutation with entered OTP", async () => {
    statusMock.mockReturnValue({ data: pending, isLoading: false });
    render(<PhoneSection />);

    await userEvent.type(screen.getByLabelText(/verification code/i), "123456");
    await userEvent.click(screen.getByRole("button", { name: /^verify$/i }));

    expect(confirmMock).toHaveBeenCalledWith("123456", expect.any(Object));
  });

  it("requires confirmation before clearing phone", async () => {
    statusMock.mockReturnValue({ data: verified, isLoading: false });
    render(<PhoneSection />);

    await userEvent.click(screen.getByRole("button", { name: /remove phone/i }));
    expect(clearMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /yes, remove/i }));
    expect(clearMock).toHaveBeenCalled();
  });

  it("renders SMS usage and cap-reached warning", () => {
    statusMock.mockReturnValue({ data: verified, isLoading: false });
    usageMock.mockReturnValue({
      data: { ...usage, canSend: false },
      isLoading: false,
    });
    render(<PhoneSection />);

    expect(screen.getByText(/sms usage today/i)).toBeInTheDocument();
    expect(screen.getByText(/daily cap reached/i)).toBeInTheDocument();
  });
});
