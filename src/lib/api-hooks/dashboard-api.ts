"use client";

import { useQuery } from "@tanstack/react-query";

import { useApiClient } from "@/hooks/use-api-client";
import { USE_MOCK } from "@/lib/mock-data";
import type { KPIData, AlertItem, PreviewData } from "@/lib/mock-data/dashboard-hooks";

export function useDashboardKPIsAPI(timeframe: string, selectedListings: string[]) {
  const apiClient = useApiClient();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  params.set("start_date", timeframe);
  params.set("end_date", timeframe);

  return useQuery<KPIData[]>({
    queryKey: ["dashboard-kpis", timeframe, ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: KPIData[] }>(`/dashboard/kpis?${params.toString()}`);
      return response.data;
    },
    enabled: !USE_MOCK,
  });
}

export function useDashboardAlertsAPI(selectedListings: string[]) {
  const apiClient = useApiClient();

  return useQuery<AlertItem[]>({
    queryKey: ["dashboard-alerts", ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: AlertItem[] }>("/dashboard/alerts");
      return response.data;
    },
    enabled: !USE_MOCK,
  });
}

export function useDashboardPreviewAPI(selectedListings: string[], timeframe: string) {
  const apiClient = useApiClient();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));

  return useQuery<PreviewData>({
    queryKey: ["dashboard-preview", timeframe, ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: PreviewData }>(`/dashboard/preview?${params.toString()}`);
      return response.data;
    },
    enabled: !USE_MOCK,
  });
}

export function useDashboardCompareAPI(selectedListings: string[], timeframe: string) {
  const apiClient = useApiClient();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  params.set("start_date", timeframe);
  params.set("end_date", timeframe);

  return useQuery({
    queryKey: ["dashboard-compare", timeframe, ...selectedListings],
    queryFn: async () => {
      const response = await apiClient.get<{ data: unknown }>(`/dashboard/compare?${params.toString()}`);
      return response.data;
    },
    enabled: !USE_MOCK && selectedListings.length > 0,
  });
}
