// Client-side error/telemetry via the Application Insights browser SDK (F.6a).
//
// Sends to the SAME australiaeast App Insights resource the api uses, so
// client errors stay in-region (no offshore SaaS, no new subprocessor). Gated
// on NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING: unset (local/CI) is a
// no-op, so nothing tries to talk to Azure and builds stay clean.
//
// Privacy posture: cookies off, and ajax/fetch tracking off so we don't ship
// every /be request URL. We keep route (page-view) tracking for error context
// and auto window.onerror exception capture; React error boundaries catch
// render errors before they reach window.onerror, so those are reported
// explicitly via trackError.
import { ApplicationInsights } from "@microsoft/applicationinsights-web";

let client: ApplicationInsights | null = null;

export function initAppInsights(): ApplicationInsights | null {
  if (typeof window === "undefined") return null; // browser only
  if (client) return client;

  const connectionString = process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (!connectionString) return null; // no-op when unconfigured

  client = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: true,
      disableCookiesUsage: true,
      disableAjaxTracking: true,
      disableFetchTracking: true,
    },
  });
  client.loadAppInsights();
  client.trackPageView();
  return client;
}

export function trackError(error: unknown): void {
  const ai = client ?? initAppInsights();
  if (!ai) return;
  ai.trackException({
    exception: error instanceof Error ? error : new Error(String(error)),
  });
}
