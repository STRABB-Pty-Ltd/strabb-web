import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BillingStatusResponse, SubscriptionResponse } from "@/lib/schemas/billing";

const billingMock = vi.fn();

vi.mock("@/hooks/use-billing", () => ({
  useBillingStatus: () => billingMock(),
}));

import { BillingNavPill } from "./billing-nav-pill";

function sub(overrides: Partial<SubscriptionResponse> = {}): SubscriptionResponse {
  return {
    id: "s",
    tenantId: "t",
    stripeSubscriptionId: null,
    status: "trial",
    listingQuantity: 1,
    currentPeriodStart: null,
    currentPeriodEnd: null,
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

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

describe("BillingNavPill", () => {
  beforeEach(() => {
    billingMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-25T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hides while loading", () => {
    billingMock.mockReturnValue({ data: undefined });
    const { container } = render(<BillingNavPill />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides for active subscriptions", () => {
    billingMock.mockReturnValue({
      data: statusFor({
        hasActiveSubscription: true,
        subscription: sub({ status: "active" }),
      }),
    });
    const { container } = render(<BillingNavPill />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows trial countdown days", () => {
    billingMock.mockReturnValue({
      data: statusFor({
        subscription: sub({ status: "trial", trialEndsAt: daysFromNow(5) }),
      }),
    });
    render(<BillingNavPill />);
    expect(screen.getByRole("link", { name: /5 days left/i })).toBeInTheDocument();
  });

  it("shows 'trial expired' when past end date", () => {
    billingMock.mockReturnValue({
      data: statusFor({
        subscription: sub({ status: "trial", trialEndsAt: daysFromNow(-1) }),
      }),
    });
    render(<BillingNavPill />);
    expect(screen.getByRole("link", { name: /trial expired/i })).toBeInTheDocument();
  });

  it("shows payment failed for past_due", () => {
    billingMock.mockReturnValue({
      data: statusFor({ subscription: sub({ status: "past_due" }) }),
    });
    render(<BillingNavPill />);
    expect(screen.getByRole("link", { name: /payment failed/i })).toBeInTheDocument();
  });

  it("shows 'start trial' CTA when no subscription exists", () => {
    billingMock.mockReturnValue({ data: statusFor() });
    render(<BillingNavPill />);
    expect(screen.getByRole("link", { name: /start trial/i })).toBeInTheDocument();
  });
});
