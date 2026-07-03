import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BillingStatusResponse, SubscriptionResponse } from "@/lib/schemas/billing";

const billingMock = vi.fn();
const startTrialMock = vi.fn();
const checkoutMock = vi.fn();
const portalMock = vi.fn();
const addToastMock = vi.fn();

vi.mock("@/hooks/use-billing", () => ({
  useBillingStatus: () => billingMock(),
  useStartTrial: () => ({ mutate: startTrialMock, isPending: false }),
  useCreateCheckout: () => ({ mutate: checkoutMock, isPending: false }),
  useCreatePortal: () => ({ mutate: portalMock, isPending: false }),
}));

vi.mock("@/stores/app-store", () => ({
  useAppStore: (selector: (s: { addToast: typeof addToastMock }) => unknown) =>
    selector({ addToast: addToastMock }),
}));

// BillingSection now reads the session role (owner/admin defence-in-depth);
// stub an owner session so the billing controls render.
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { role: "owner" }, status: "authenticated" }),
}));

import { BillingSection } from "./billing-section";

function sub(overrides: Partial<SubscriptionResponse> = {}): SubscriptionResponse {
  return {
    id: "s",
    tenantId: "t",
    stripeSubscriptionId: null,
    status: "active",
    listingQuantity: 5,
    currentPeriodStart: "2026-04-01T00:00:00Z",
    currentPeriodEnd: "2026-05-01T00:00:00Z",
    trialEndsAt: null,
    cancelledAt: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function statusFor(overrides: Partial<BillingStatusResponse> = {}): BillingStatusResponse {
  return {
    subscription: null,
    billableListingCount: 0,
    hasActiveSubscription: false,
    ...overrides,
  };
}

describe("BillingSection", () => {
  beforeEach(() => {
    billingMock.mockReset();
    startTrialMock.mockReset();
    checkoutMock.mockReset();
    portalMock.mockReset();
    addToastMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows loading state while data is undefined", () => {
    billingMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<BillingSection />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders 'Start free trial' CTA when no subscription", async () => {
    billingMock.mockReturnValue({
      data: statusFor({ billableListingCount: 3 }),
      isLoading: false,
    });
    render(<BillingSection />);

    expect(screen.getByText("No subscription")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /start free trial/i });
    await userEvent.click(button);
    expect(startTrialMock).toHaveBeenCalled();
  });

  it("renders trial state with payment CTA", async () => {
    billingMock.mockReturnValue({
      data: statusFor({
        billableListingCount: 4,
        subscription: sub({
          status: "trial",
          trialEndsAt: "2026-05-01T00:00:00Z",
        }),
      }),
      isLoading: false,
    });
    render(<BillingSection />);

    expect(screen.getByText("Free Trial")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /add payment details/i });
    await userEvent.click(button);
    expect(checkoutMock).toHaveBeenCalled();
  });

  it("renders active state with portal CTA", async () => {
    billingMock.mockReturnValue({
      data: statusFor({
        hasActiveSubscription: true,
        billableListingCount: 6,
        subscription: sub({ status: "active" }),
      }),
      isLoading: false,
    });
    render(<BillingSection />);

    expect(screen.getByText("Active")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /manage subscription/i });
    await userEvent.click(button);
    expect(portalMock).toHaveBeenCalled();
  });

  it("renders past_due state with portal CTA", async () => {
    billingMock.mockReturnValue({
      data: statusFor({
        billableListingCount: 2,
        subscription: sub({ status: "past_due" }),
      }),
      isLoading: false,
    });
    render(<BillingSection />);

    expect(screen.getByText("Payment Failed")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /manage subscription/i });
    await userEvent.click(button);
    expect(portalMock).toHaveBeenCalled();
  });

  it("renders cancelled state with reactivate CTA", async () => {
    billingMock.mockReturnValue({
      data: statusFor({
        billableListingCount: 0,
        subscription: sub({ status: "cancelled" }),
      }),
      isLoading: false,
    });
    render(<BillingSection />);

    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /reactivate/i });
    await userEvent.click(button);
    expect(checkoutMock).toHaveBeenCalled();
  });
});
