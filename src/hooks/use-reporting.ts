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
    refetch: apiResult.refetch,
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
    refetch: apiResult.refetch,
  };
}

export function useSavedReports() {
  const setActiveSavedReport = useAppStore((s) => s.setActiveSavedReport);
  const setTimeframe = useAppStore((s) => s.setTimeframe);
  const setSubmenu = useAppStore((s) => s.setSubmenu);
  const windowSize = useAppStore((s) => s.reporting.windowSize);
  const submenu = useAppStore((s) => s.reporting.submenu);
  const activeSavedReport = useAppStore((s) => s.reporting.activeSavedReport);
  const addToast = useAppStore((s) => s.addToast);

  // Backed by the real /saved-reports endpoints so reports persist across
  // reloads (previously an in-memory Zustand store that vanished on refresh).
  const { data: savedReports = [] } = useSavedReportsAPI();
  const createReport = useCreateSavedReportAPI();
  const removeReport = useDeleteSavedReportAPI();

  const loadReport = (id: string) => {
    const report = savedReports.find((r) => r.id === id);
    if (!report) return;
    // Apply the preset: its timeframe granularity + active chips, against the
    // user's current period/listings. setTimeframe resets the anchor to the
    // current period (presets don't pin a period). setActiveSavedReport runs
    // last so the highlight survives the setTimeframe/setSubmenu clears that
    // those setters apply on the reporting page (see app-store).
    setTimeframe("reporting", report.timeframe);
    setSubmenu("reporting", report.submenu);
    setActiveSavedReport(id);
  };

  const saveCurrentReport = (name: string) => {
    // Saved reports are view PRESETS, not snapshots: we deliberately capture
    // only the timeframe granularity + active chips, not the anchored period or
    // listing selection. Loading a preset applies it to the user's current
    // period/listings (see loadReport).
    //
    // Surface the outcome: the mutation was previously fire-and-forget, so a
    // failed POST (403 for a non-owner, a validation 422, a rate-limit, a
    // dropped request) left the user with no error and no new row - i.e. "save
    // silently does nothing". A success toast also confirms the (async) persist
    // before the list refetch lands.
    createReport.mutate(
      { name, timeframe: windowSize, submenu },
      {
        onSuccess: () => addToast({ type: "success", message: `Saved report "${name}"` }),
        onError: (err: unknown) =>
          addToast({
            type: "error",
            message: err instanceof Error ? err.message : "Failed to save report",
          }),
      },
    );
  };

  const deleteReport = (id: string) => {
    removeReport.mutate(id, {
      onSuccess: () => addToast({ type: "success", message: "Report deleted" }),
      onError: (err: unknown) =>
        addToast({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to delete report",
        }),
    });
  };

  const resetToDefaultView = () => {
    // Snap the canvas back to the default Reporting/Overview view and clear
    // the active saved report so no row stays highlighted. "month" mirrors the
    // reporting slice's default windowSize; ["overview"] is the default submenu.
    setTimeframe("reporting", "month");
    setSubmenu("reporting", ["overview"]);
    setActiveSavedReport(null);
  };

  return {
    savedReports,
    activeSavedReport,
    loadReport,
    saveCurrentReport,
    deleteReport,
    resetToDefaultView,
  };
}
