"use client";

import { useMutation } from "@tanstack/react-query";

import { useApiClient } from "./use-api-client";

interface FeedbackData {
  message: string;
  pageUrl?: string;
}

export function useSubmitFeedback() {
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: async (data: FeedbackData) => {
      await apiClient.post("/feedback", {
        message: data.message,
        page_url: data.pageUrl ?? null,
      });
    },
  });
}
