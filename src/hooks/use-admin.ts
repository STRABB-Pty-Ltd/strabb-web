"use client";

import { useAuthenticatedQuery } from "./use-authenticated-query";
import { keysToCamel } from "@/lib/case-utils";
import type { SyncLogResponse } from "@/lib/schemas/admin";
import type { ScheduledMessageResponse } from "@/lib/schemas/message";

interface SystemHealth {
  syncErrors: number;
  listingsErrored: number;
  tasksFailed: number;
  messagesFailed: number;
  notificationFailures: number;
  hasIssues: boolean;
}

export function useSystemHealth() {
  return useAuthenticatedQuery<SystemHealth>(["admin", "health"], "/admin/health", {
    select: (raw) => keysToCamel<SystemHealth>(raw),
  });
}

interface AdminListEnvelope<T> {
  data: T[];
}

export function useSyncErrors() {
  return useAuthenticatedQuery<AdminListEnvelope<SyncLogResponse>>(
    ["admin", "sync-errors"],
    "/admin/sync-errors",
    { select: (raw) => keysToCamel<AdminListEnvelope<SyncLogResponse>>(raw) },
  );
}

export function useFailedMessages() {
  return useAuthenticatedQuery<AdminListEnvelope<ScheduledMessageResponse>>(
    ["admin", "failed-messages"],
    "/admin/failed-messages",
    { select: (raw) => keysToCamel<AdminListEnvelope<ScheduledMessageResponse>>(raw) },
  );
}
