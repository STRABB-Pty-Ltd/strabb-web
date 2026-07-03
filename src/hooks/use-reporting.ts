"use client";

import {
  useReportingKPIsAPI,
  useReportingChartDataAPI,
  useSavedReportsAPI,
  useCreateSavedReportAPI,
  useDeleteSavedReportAPI,
  type SavedReportConfig,
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
  const setSelectedListings = useAppStore((s) => s.setSelectedListings);
  const setCustomRange = useAppStore((s) => s.setCustomRange);
  const windowSize = useAppStore((s) => s.reporting.windowSize);
  const anchor = useAppStore((s) => s.reporting.anchor);
  const submenu = useAppStore((s) => s.reporting.submenu);
  const selectedListings = useAppStore((s) => s.selectedListings);
  const customRange = useAppStore((s) => s.customRange);
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
    // Restore the saved snapshot: granularity + the pinned period (anchor),
    // active chips, and the listing selection - so a report saved on "May /
    // Lodge" reloads as May / Lodge, not the current month / whole portfolio.
    // A null saved anchor reloads as the current period (relative), matching
    // how it was saved. setTimeframe takes the anchor as its 3rd arg so window
    // size + period land together. setActiveSavedReport runs LAST so the row
    // highlight survives the activeSavedReport clears that setTimeframe/
    // setSubmenu apply on the reporting page (see app-store).
    setTimeframe("reporting", report.timeframe, report.configJson?.anchor ?? null);
    setSubmenu("reporting", report.submenu);
    setSelectedListings(report.listingIds ?? []);
    if (report.timeframe === "custom") {
      setCustomRange(report.configJson?.customRange ?? null);
    }
    setActiveSavedReport(id);
  };

  const saveCurrentReport = (name: string) => {
    // A saved report is a SNAPSHOT of the current view: granularity + active
    // chips + the pinned period (anchor) + the listing selection. Capturing the
    // anchor is what lets a report saved on a specific month reload as that
    // month instead of defaulting to the current one; a null anchor stays
    // "current period". customRange rides along only for a custom timeframe.
    //
    // Surface the outcome: the mutation was previously fire-and-forget, so a
    // failed POST (403 for a non-owner, a validation 422, a rate-limit, a
    // dropped request) left the user with no error and no new row - i.e. "save
    // silently does nothing". A success toast also confirms the (async) persist
    // before the list refetch lands.
    const configJson: SavedReportConfig = { anchor };
    if (windowSize === "custom") configJson.customRange = customRange;
    createReport.mutate(
      { name, timeframe: windowSize, submenu, listingIds: selectedListings, configJson },
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
