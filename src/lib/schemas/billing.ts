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
  trial: "text-blue-600 dark:text-blue-400",
  active: "text-green-700 dark:text-green-400",
  past_due: "text-red-600 dark:text-red-400",
  cancelled: "text-muted-foreground",
};
