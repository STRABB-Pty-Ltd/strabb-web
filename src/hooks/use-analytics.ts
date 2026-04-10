"use client";

import { useApiClient } from "./use-api-client";

/**
 * Fire-and-forget analytics event tracking.
 * Failures are silently ignored — analytics should never break UX.
 */
export function useTrackEvent() {
  const apiClient = useApiClient();

  return (eventName: string, metadata?: Record<string, unknown>) => {
    apiClient
      .post("/analytics/track", {
        event_name: eventName,
        metadata: metadata ?? null,
      })
      .catch(() => {
        // Silently ignore analytics failures
      });
  };
}
