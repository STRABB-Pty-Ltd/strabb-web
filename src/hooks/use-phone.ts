"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "./use-api-client";
import type { PhoneStatusResponse, SmsUsageSummaryResponse } from "@/lib/schemas/phone";

const PHONE_KEY = ["phone"];
const SMS_USAGE_KEY = ["sms-usage"];

export function usePhoneStatus() {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<PhoneStatusResponse>({
    queryKey: [...PHONE_KEY, "status"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: PhoneStatusResponse }>("/users/me/phone");
      return response.data;
    },
    enabled: isReady,
  });
}

export function useSmsUsage() {
  const apiClient = useApiClient();
  const isReady = useAuthReady();

  return useQuery<SmsUsageSummaryResponse>({
    queryKey: SMS_USAGE_KEY,
    queryFn: async () => {
      const response = await apiClient.get<{ data: SmsUsageSummaryResponse }>(
        "/users/me/sms-usage",
      );
      return response.data;
    },
    enabled: isReady,
  });
}

export function useRequestPhoneVerification() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      await apiClient.post<{ data: { sent: boolean } }>("/users/me/phone/verify-request", {
        phoneNumber,
      });
    },
    meta: { suppressGlobalError: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHONE_KEY });
    },
  });
}

export function useConfirmPhoneVerification() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await apiClient.post<{ data: PhoneStatusResponse }>(
        "/users/me/phone/verify-confirm",
        { code },
      );
      return response.data;
    },
    meta: { suppressGlobalError: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHONE_KEY });
      queryClient.invalidateQueries({ queryKey: SMS_USAGE_KEY });
    },
  });
}

export function useClearPhone() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete<{ data: { cleared: boolean } }>("/users/me/phone");
    },
    meta: { suppressGlobalError: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHONE_KEY });
      queryClient.invalidateQueries({ queryKey: SMS_USAGE_KEY });
    },
  });
}
