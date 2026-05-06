"use client";

import { useQuery } from "@tanstack/react-query";

import { useApiClient, useAuthReady } from "@/hooks/use-api-client";
import type { Vacancy } from "@/types/vacancy";

export function useVacancyAPI(
  selectedListings: string[],
  startDate?: string,
  endDate?: string,
  minGapDays?: number,
) {
  const apiClient = useApiClient();
  const isReady = useAuthReady();
  const params = new URLSearchParams();
  selectedListings.forEach((id) => params.append("listing_ids", id));
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  if (minGapDays) params.set("min_gap_days", String(minGapDays));

  return useQuery<Vacancy[]>({
    queryKey: ["vacancy", ...selectedListings, startDate, endDate, minGapDays],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Vacancy[] }>(`/vacancy?${params.toString()}`);
      return response.data;
    },
    enabled: isReady,
  });
}
