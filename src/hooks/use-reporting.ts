"use client";

import {
  useReportingKPIsAPI,
  useReportingChartDataAPI,
  useSavedReportsAPI,
  useCreateSavedReportAPI,
  useDeleteSavedReportAPI,
} from "@/lib/api-hooks/reporting-api";
import { useAppStore } from "@/stores/app-store";

export type { ReportingKPI, ChartDataSet } from "@/lib/api-hooks/reporting-api";

export function useReportingKPIs(
  selectedListings: string[],
  windowSize: string,
  anchor: string | null,
) {
  const apiResult = useReportingKPIsAPI(selectedListings, windowSize, anchor);

  return {
    data: apiResult.data,
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useReportingChartData(
  selectedListings: string[],
  windowSize: string,
  anchor: string | null,
) {
  const apiResult = useReportingChartDataAPI(selectedListings, windowSize, anchor);

  return {
    data: apiResult.data,
    isLoading: apiResult.isLoading,
    error: apiResult.error,
  };
}

export function useSavedReports() {
  const setActiveSavedReport = useAppStore((s) => s.setActiveSavedReport);
  const setTimeframe = useAppStore((s) => s.setTimeframe);
  const setSubmenu = useAppStore((s) => s.setSubmenu);
  const windowSize = useAppStore((s) => s.reporting.windowSize);
  const submenu = useAppStore((s) => s.reporting.submenu);

  // Backed by the real /saved-reports endpoints so reports persist across
  // reloads (previously an in-memory Zustand store that vanished on refresh).
  const { data: savedReports = [] } = useSavedReportsAPI();
  const createReport = useCreateSavedReportAPI();
  const removeReport = useDeleteSavedReportAPI();

  const loadReport = (id: string) => {
    const report = savedReports.find((r) => r.id === id);
    if (!report) return;
    // Actually apply the saved view: its timeframe + active chips. The
    // reporting queries key off windowSize, so this re-fetches and the
    // screen updates - not just a stored "active" marker that nothing read.
    setTimeframe("reporting", report.timeframe);
    setSubmenu("reporting", report.submenu);
    setActiveSavedReport(id);
  };

  const saveCurrentReport = (name: string) => {
    createReport.mutate({ name, timeframe: windowSize, submenu });
  };

  const deleteReport = (id: string) => {
    removeReport.mutate(id);
  };

  return {
    savedReports,
    loadReport,
    saveCurrentReport,
    deleteReport,
  };
}
