export interface SubscriptionResponse {
  id: string;
  tenantId: string;
  stripeSubscriptionId: string | null;
  status: string;
  listingQuantity: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingStatusResponse {
  subscription: SubscriptionResponse | null;
  billableListingCount: number;
  hasActiveSubscription: boolean;
}

export const BILLING_STATUS_LABELS: Record<string, string> = {
  trial: "Free Trial",
  active: "Active",
  past_due: "Payment Failed",
  cancelled: "Cancelled",
};

export const BILLING_STATUS_COLORS: Record<string, string> = {
  trial: "text-highlight-10 dark:text-highlight-10",
  active: "text-status-success dark:text-status-success",
  past_due: "text-status-danger dark:text-status-danger",
  cancelled: "text-muted-foreground",
};
