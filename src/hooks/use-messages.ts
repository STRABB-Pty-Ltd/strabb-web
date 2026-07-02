"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "./use-api-client";
import { useAuthenticatedQuery } from "./use-authenticated-query";
import { keysToCamel, keysToSnake } from "@/lib/case-utils";
import type {
  MessageLogListResponse,
  MessageTemplateResponse,
  ScheduledMessageListResponse,
} from "@/lib/schemas/message";

const TEMPLATES_KEY = ["message-templates"];
const MESSAGES_KEY = ["scheduled-messages"];
const LOGS_KEY = ["message-logs"];

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
        {},
      );
      return keysToCamel<MessageTemplateResponse[]>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

export function useDeleteTemplate() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    // The API refuses to delete a tenant-wide default (property_id is null) and
    // returns 400; the UI only offers delete on property-scoped templates, but
    // the caller should still surface any error via a toast.
    mutationFn: async (id: string) => {
      await apiClient.delete(`/messages/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    },
  });
}

export interface ScheduledMessagesFilter {
  status?: string;
  bookingId?: string;
  page?: number;
  pageSize?: number;
}

export function useScheduledMessages(filter: ScheduledMessagesFilter | string = {}) {
  const normalised: ScheduledMessagesFilter =
    typeof filter === "string" ? { bookingId: filter } : filter;
  const { status, bookingId, page = 1, pageSize = 20 } = normalised;

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (bookingId) params.set("booking_id", bookingId);
  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  return useAuthenticatedQuery<ScheduledMessageListResponse>(
    [...MESSAGES_KEY, status ?? "any", bookingId ?? "all", String(page), String(pageSize)],
    `/messages/scheduled?${params.toString()}`,
    { select: (raw) => keysToCamel<ScheduledMessageListResponse>(raw) },
  );
}

export function useMessageLogs(page = 1, pageSize = 20) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  return useAuthenticatedQuery<MessageLogListResponse>(
    [...LOGS_KEY, String(page), String(pageSize)],
    `/messages/logs?${params.toString()}`,
    { select: (raw) => keysToCamel<MessageLogListResponse>(raw) },
  );
}

export function useProcessMessages() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{
        data: { processed: number; sent: number; failed: number };
      }>("/messages/process", {});
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
        {},
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_KEY });
    },
  });
}
