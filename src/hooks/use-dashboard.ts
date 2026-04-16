"use client";

import { USE_MOCK } from "@/lib/mock-data";
import {
  useDashboardKPIsMock,
  useDashboardAlertsMock,
  useDashboardPreviewMock,
} from "@/lib/mock-data/dashboard-hooks";
import {
  useDashboardKPIsAPI,
  useDashboardAlertsAPI,
  useDashboardPreviewAPI,
} from "@/lib/api-hooks/dashboard-api";

export type { KPIData, AlertItem, PreviewData } from "@/lib/mock-data/dashboard-hooks";

export function useDashboardKPIs(timeframe: string, selectedListings: string[]) {
  // Both hooks are always called (Rules of Hooks), but API hooks use enabled: !USE_MOCK
  // so they become no-ops in mock mode, and mock hooks short-circuit when USE_MOCK is false
  const mockResult = useDashboardKPIsMock(timeframe, selectedListings);
  const apiResult = useDashboardKPIsAPI(timeframe, selectedListings);

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }

  return {
    data: apiResult.data,
    isLoading: apiResult.isPending,
    error: apiResult.error,
  };
}

export function useDashboardAlerts(selectedListings: string[]) {
  const mockResult = useDashboardAlertsMock(selectedListings);
  const apiResult = useDashboardAlertsAPI(selectedListings);

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }

  return {
    data: apiResult.data,
    isLoading: apiResult.isPending,
    error: apiResult.error,
  };
}

export function useDashboardPreview(selectedListings: string[], timeframe: string) {
  const mockResult = useDashboardPreviewMock(selectedListings, timeframe);
  const apiResult = useDashboardPreviewAPI(selectedListings, timeframe);

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }

  return {
    data: apiResult.data,
    isLoading: apiResult.isPending,
    error: apiResult.error,
  };
}
