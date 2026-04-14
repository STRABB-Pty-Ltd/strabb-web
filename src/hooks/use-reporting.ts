"use client";

import { USE_MOCK } from "@/lib/mock-data";
import { useReportingKPIsMock, useReportingChartDataMock } from "@/lib/mock-data/reporting-hooks";
import { useReportingKPIsAPI, useReportingChartDataAPI } from "@/lib/api-hooks/reporting-api";
import { useAppStore } from "@/stores/app-store";

export type { ReportingKPI, ChartDataSet } from "@/lib/mock-data/reporting-hooks";

export function useReportingKPIs(selectedListings: string[], timeframe?: string) {
  const mockResult = useReportingKPIsMock(selectedListings);
  const apiResult = useReportingKPIsAPI(selectedListings, timeframe);

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }

  if (apiResult.error) {
    console.warn("API unavailable for reporting KPIs, using mock data");
    return { data: mockResult, isLoading: false, error: null };
  }

  return {
    data: apiResult.data ?? mockResult,
    isLoading: apiResult.isLoading,
    error: null,
  };
}

export function useReportingChartData(selectedListings: string[], timeframe?: string) {
  const mockResult = useReportingChartDataMock(selectedListings);
  const apiResult = useReportingChartDataAPI(selectedListings, timeframe);

  if (USE_MOCK) {
    return { data: mockResult, isLoading: false, error: null };
  }

  if (apiResult.error) {
    console.warn("API unavailable for reporting charts, using mock data");
    return { data: mockResult, isLoading: false, error: null };
  }

  return {
    data: apiResult.data ?? mockResult,
    isLoading: apiResult.isLoading,
    error: null,
  };
}

export function useSavedReports() {
  const savedReports = useAppStore((s) => s.reporting.savedReports);
  const addSavedReport = useAppStore((s) => s.addSavedReport);
  const deleteSavedReport = useAppStore((s) => s.deleteSavedReport);
  const setActiveSavedReport = useAppStore((s) => s.setActiveSavedReport);
  const timeframe = useAppStore((s) => s.reporting.timeframe);
  const submenu = useAppStore((s) => s.reporting.submenu);

  const loadReport = (id: string) => {
    const report = savedReports.find((r) => r.id === id);
    if (!report) return;
    setActiveSavedReport(id);
  };

  const saveCurrentReport = (name: string) => {
    addSavedReport({
      id: `sr-${Date.now()}`,
      name,
      timeframe,
      submenu,
      createdAt: new Date().toISOString(),
    });
  };

  const deleteReport = (id: string) => {
    deleteSavedReport(id);
  };

  return {
    savedReports,
    loadReport,
    saveCurrentReport,
    deleteReport,
  };
}
