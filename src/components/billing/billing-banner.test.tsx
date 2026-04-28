import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BillingStatusResponse } from "@/lib/schemas/billing";

const billingMock = vi.fn();

vi.mock("@/hooks/use-billing", () => ({
  useBillingStatus: () => billingMock(),
}));

import { BillingBanner } from "./billing-banner";

function statusFor(overrides: Partial<BillingStatusResponse> = {}): BillingStatusResponse {
  return {
    subscription: null,
    billableListingCount: 0,
    hasActiveSubscription: false,
    ...overrides,
  };
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

describe("BillingBanner", () => {
  beforeEach(() => {
    billingMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-25T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when there is no data", () => {
    billingMock.mockReturnValue({ data: undefined });
    const { container } = render(<BillingBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when subscription is active", () => {
    billingMock.mockReturnValue({
      data: statusFor({ hasActiveSubscription: true }),
    });
    const { container } = render(<BillingBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders past_due message", () => {
    billingMock.mockReturnValue({
      data: statusFor({
        subscription: {
          id: "s",
          tenantId: "t",
          stripeSubscriptionId: null,
          status: "past_due",
          listingQuantity: 1,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          trialEndsAt: null,
          cancelledAt: null,
          createdAt: "",
          updatedAt: "",
        },
      }),
    });
    render(<BillingBanner />);
    expect(screen.getByText(/payment has failed/i)).toBeInTheDocument();
  });

  it("renders cancelled message", () => {
    billingMock.mockReturnValue({
      data: statusFor({
        subscription: {
          id: "s",
          tenantId: "t",
          stripeSubscriptionId: null,
          status: "cancelled",
          listingQuantity: 1,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          trialEndsAt: null,
          cancelledAt: "2026-04-01T00:00:00Z",
          createdAt: "",
          updatedAt: "",
        },
      }),
    });
    render(<BillingBanner />);
    expect(screen.getByText(/subscription has been cancelled/i)).toBeInTheDocument();
  });

  it("renders trial countdown when ending within threshold", () => {
    billingMock.mockReturnValue({
      data: statusFor({
        subscription: {
          id: "s",
          tenantId: "t",
          stripeSubscriptionId: null,
          status: "trial",
          listingQuantity: 1,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          trialEndsAt: daysFromNow(3),
          cancelledAt: null,
          createdAt: "",
          updatedAt: "",
        },
      }),
    });
    render(<BillingBanner />);
    expect(screen.getByText(/3 days left in your free trial/i)).toBeInTheDocument();
  });

  it("renders 'ends today' copy when zero days left", () => {
    billingMock.mockReturnValue({
      data: statusFor({
        subscription: {
          id: "s",
          tenantId: "t",
          stripeSubscriptionId: null,
          status: "trial",
          listingQuantity: 1,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          trialEndsAt: daysFromNow(0),
          cancelledAt: null,
          createdAt: "",
          updatedAt: "",
        },
      }),
    });
    render(<BillingBanner />);
    expect(screen.getByText(/free trial ends today/i)).toBeInTheDocument();
  });

  it("renders nothing when trial has plenty of days left", () => {
    billingMock.mockReturnValue({
      data: statusFor({
        subscription: {
          id: "s",
          tenantId: "t",
          stripeSubscriptionId: null,
          status: "trial",
          listingQuantity: 1,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          trialEndsAt: daysFromNow(20),
          cancelledAt: null,
          createdAt: "",
          updatedAt: "",
        },
      }),
    });
    const { container } = render(<BillingBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders trial expired message when past trial end", () => {
    billingMock.mockReturnValue({
      data: statusFor({
        subscription: {
          id: "s",
          tenantId: "t",
          stripeSubscriptionId: null,
          status: "trial",
          listingQuantity: 1,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          trialEndsAt: daysFromNow(-2),
          cancelledAt: null,
          createdAt: "",
          updatedAt: "",
        },
      }),
    });
    render(<BillingBanner />);
    expect(screen.getByText(/free trial has expired/i)).toBeInTheDocument();
  });

  it("renders 'start your free trial' when no subscription exists", () => {
    billingMock.mockReturnValue({ data: statusFor() });
    render(<BillingBanner />);
    expect(screen.getByText(/start your free trial/i)).toBeInTheDocument();
  });
});
