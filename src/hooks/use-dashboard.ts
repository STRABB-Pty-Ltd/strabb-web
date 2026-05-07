"use client";

import {
  useDashboardKPIsAPI,
  useDashboardAlertsAPI,
  useDashboardPreviewAPI,
} from "@/lib/api-hooks/dashboard-api";

export type { KPIData, AlertItem, PreviewData } from "@/lib/api-hooks/dashboard-api";

export function useDashboardKPIs(
  windowSize: string,
  anchor: string | null,
  selectedListings: string[],
) {
  const apiResult = useDashboardKPIsAPI(windowSize, anchor, selectedListings);

  return {
    data: apiResult.data,
    isLoading: apiResult.isPending,
    error: apiResult.error,
  };
}

export function useDashboardAlerts(selectedListings: string[]) {
  const apiResult = useDashboardAlertsAPI(selectedListings);

  return {
    data: apiResult.data,
    isLoading: apiResult.isPending,
    error: apiResult.error,
  };
}

export function useDashboardPreview(
  selectedListings: string[],
  windowSize: string,
  anchor: string | null,
) {
  const apiResult = useDashboardPreviewAPI(selectedListings, windowSize, anchor);

  return {
    data: apiResult.data,
    isLoading: apiResult.isPending,
    error: apiResult.error,
  };
}
