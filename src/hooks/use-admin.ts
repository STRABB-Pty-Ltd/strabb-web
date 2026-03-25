"use client";

import { useAuthenticatedQuery } from "./use-authenticated-query";
import { keysToCamel } from "@/lib/case-utils";

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
