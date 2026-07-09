"use client";

import { useEffect } from "react";

import { trackError } from "@/lib/app-insights";

// Route-subtree error boundary (F.6a). Renders a recoverable fallback instead
// of a white screen and reports the crash to App Insights. React error
// boundaries catch render errors before they reach window.onerror, so the
// explicit trackError here is what captures them.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    trackError(error);
  }, [error]);

  return (
    <div className="gap-base p-base flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        An unexpected error occurred. You can try again, or reload the page if it persists.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
