"use client";

import { useEffect } from "react";

import { initAppInsights } from "@/lib/app-insights";

// Side-effect-only: initialises the App Insights browser SDK once on mount
// (no-op when no connection string is configured). Renders nothing.
export function AppInsightsProvider() {
  useEffect(() => {
    initAppInsights();
  }, []);
  return null;
}
