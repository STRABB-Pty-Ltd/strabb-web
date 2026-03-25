"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "./use-api-client";
import { useAuthenticatedQuery } from "./use-authenticated-query";
import { keysToCamel } from "@/lib/case-utils";
import type { BillingStatusResponse } from "@/lib/schemas/billing";

const BILLING_KEY = ["billing"];

export function useBillingStatus() {
  return useAuthenticatedQuery<BillingStatusResponse>(
    [...BILLING_KEY, "status"],
    "/billing/status",
    { select: (raw) => keysToCamel<BillingStatusResponse>(raw) },
  );
}

export function useStartTrial() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post("/billing/start-trial");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEY });
    },
  });
}

export function useCreateCheckout() {
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        data: { checkout_url: string };
      }>("/billing/checkout");
      return response.data.checkout_url;
    },
  });
}

export function useCreatePortal() {
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        data: { portal_url: string };
      }>("/billing/portal");
      return response.data.portal_url;
    },
  });
}
