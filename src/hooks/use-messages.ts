"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "./use-api-client";
import { useAuthenticatedQuery } from "./use-authenticated-query";
import { keysToCamel, keysToSnake } from "@/lib/case-utils";
import type { MessageTemplateResponse, ScheduledMessageListResponse } from "@/lib/schemas/message";

const TEMPLATES_KEY = ["message-templates"];
const MESSAGES_KEY = ["scheduled-messages"];

export function useMessageTemplates() {
  return useAuthenticatedQuery<MessageTemplateResponse[]>(TEMPLATES_KEY, "/messages/templates", {
    select: (raw) => keysToCamel<MessageTemplateResponse[]>(raw),
  });
}

export function useCreateTemplate() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await apiClient.post<{ data: Record<string, unknown> }>(
        "/messages/templates",
        keysToSnake(data),
      );
      return keysToCamel<MessageTemplateResponse>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

export function useUpdateTemplate() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await apiClient.put<{ data: Record<string, unknown> }>(
        `/messages/templates/${id}`,
        keysToSnake(data),
      );
      return keysToCamel<MessageTemplateResponse>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

export function useSeedDefaults() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<MessageTemplateResponse[]>(
        "/messages/templates/seed-defaults",
      );
      return keysToCamel<MessageTemplateResponse[]>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

export function useScheduledMessages(bookingId?: string) {
  const params = new URLSearchParams();
  if (bookingId) params.set("booking_id", bookingId);

  return useAuthenticatedQuery<ScheduledMessageListResponse>(
    [...MESSAGES_KEY, bookingId ?? "all"],
    `/messages/scheduled?${params.toString()}`,
    { select: (raw) => keysToCamel<ScheduledMessageListResponse>(raw) },
  );
}

export function useProcessMessages() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        data: { processed: number; sent: number; failed: number };
      }>("/messages/process");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_KEY });
    },
  });
}

export function useResendMessage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ data: { sent: boolean } }>(
        `/messages/scheduled/${id}/resend`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_KEY });
    },
  });
}
