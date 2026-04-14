"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import type { ReportingKPI, ChartDataSet } from "@/lib/mock-data/reporting-hooks";

export function useReportingKPIsAPI(selectedListings: string[], timeframe?: string) {
  const apiClient = useApiClient();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  if (timeframe) {
    params.set("start_date", timeframe);
    params.set("end_date", timeframe);
  }

  return useQuery<ReportingKPI[]>({
    queryKey: ["reporting-kpis", ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ReportingKPI[] }>(`/reporting/financials?${params.toString()}`);
      return response.data;
    },
    enabled: !USE_MOCK,
  });
}

export function useReportingChartDataAPI(selectedListings: string[], timeframe?: string) {
  const apiClient = useApiClient();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  if (timeframe) {
    params.set("start_date", timeframe);
    params.set("end_date", timeframe);
  }

  return useQuery<ChartDataSet>({
    queryKey: ["reporting-charts", ...selectedListings],
    queryFn: async () => {
      const [occupancyRes, revenueRes, expensesRes] = await Promise.all([
        apiClient.get<{ data: Partial<ChartDataSet> }>(`/reporting/occupancy?${params.toString()}`),
        apiClient.get<{ data: Partial<ChartDataSet> }>(`/reporting/revenue-breakdown?${params.toString()}`),
        apiClient.get<{ data: Partial<ChartDataSet> }>(`/reporting/expense-breakdown?${params.toString()}`),
      ]);
      return { ...occupancyRes.data, ...revenueRes.data, ...expensesRes.data } as ChartDataSet;
    },
    enabled: !USE_MOCK,
  });
}

export interface SavedReportPayload {
  name: string;
  timeframe: string;
  submenu: string[];
}

export function useSavedReportsAPI() {
  const apiClient = useApiClient();

  return useQuery<SavedReportPayload[]>({
    queryKey: ["saved-reports"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: SavedReportPayload[] }>("/saved-reports");
      return response.data;
    },
    enabled: !USE_MOCK,
  });
}

export function useCreateSavedReportAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SavedReportPayload) => apiClient.post("/saved-reports", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-reports"] });
    },
  });
}

export function useUpdateSavedReportAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SavedReportPayload }) =>
      apiClient.put(`/saved-reports/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-reports"] });
    },
  });
}

export function useDeleteSavedReportAPI() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/saved-reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-reports"] });
    },
  });
}
